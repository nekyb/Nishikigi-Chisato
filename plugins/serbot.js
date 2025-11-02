import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, Browsers, makeWASocket as makeWASocketBaileys } from "@whiskeysockets/baileys";
import qrcode from "qrcode";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import pino from 'pino';
import { fileURLToPath } from 'url';
import { handleMessage } from '../handlers/messages.js';
import { loadCommands } from '../handlers/commands.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!global.conns)
    global.conns = [];
const rtx = `*╭─────────────────╮*
*│ 🤖 Sub-Bot System │*
*╰─────────────────╯*

📱 *Escanea este QR desde WhatsApp*

➤ Abre WhatsApp
➤ Ve a Ajustes → Dispositivos vinculados
➤ Toca "Vincular un dispositivo"
➤ Escanea el código

⏱️ El QR expira en 45 segundos

⚠️ Usa un número secundario`;
const rtx2 = `*╭──────────────────────╮*
*│ 🔐 Código de Vinculación │*
*╰──────────────────────╯*

📱 *Usa este código en WhatsApp*

➤ Abre WhatsApp
➤ Ve a Ajustes → Dispositivos vinculados
➤ Toca "Vincular con número"
➤ Ingresa el código de abajo

⏱️ Código de un solo uso

⚠️ Usa un número secundario`;
const MAX_BOTS = 10;
const COOLDOWN = 120000;
function msToTime(duration) {
    const s = Math.floor((duration / 1000) % 60);
    const m = Math.floor((duration / (1000 * 60)) % 60);
    return `${m}m ${s}s`;
}
async function connectToWhatsApp(options) {
    const { pathSession, m, conn, args } = options;
    const usePairingCode = args.includes('--code');
    const { state, saveCreds } = await useMultiFileAuthState(pathSession);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocketBaileys({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser: Browsers.macOS('Desktop'),
        msgRetryCounterCache: new NodeCache(),
        generateHighQualityLinkPreview: true,
    });
    if (!sock.commands)
        sock.commands = await loadCommands();
    if (usePairingCode && !sock.authState.creds.registered) {
        const phoneNumber = m.sender.split('@')[0];
        await conn.sendMessage(m.sender, { text: rtx2 }, { quoted: m });
        const code = await sock.requestPairingCode(phoneNumber);
        await conn.sendMessage(m.sender, {
            text: `*Tu código de vinculación es:*\n\n\`\`\`${code}\`\`\``
        }, { quoted: m });
    }
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'open') {
            const userJid = sock.authState.creds.me?.id;
            if (userJid) {
                console.log(`Sub-Bot connected: ${userJid}`);
                await conn.sendMessage(m.sender, {
                    text: `✅ ¡Conectado exitosamente como Sub-Bot!\n\n*Usuario:* @${userJid.split('@')[0]}`,
                    mentions: [userJid]
                }, { quoted: m });
                global.conns.push(sock);
            }
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const jid = path.basename(pathSession);
            if (code !== DisconnectReason.loggedOut) {
                console.log(`Reconnecting ${jid}...`);
                connectToWhatsApp(options);
            } else {
                fs.rm(pathSession, { recursive: true, force: true }, (err) => {
                    if (err)
                        console.error(`Error removing session:`, err);
                });
                global.conns = global.conns.filter(c => c.user?.id.split('@')[0] !== jid);
            }
        }
        if (qr && !usePairingCode) {
            try {
                console.log('📱 QR Code generado, enviando...');
                const qrBuffer = await qrcode.toBuffer(qr, { scale: 8 });
                const qrMsg = await conn.sendMessage(m.key.remoteJid, {
                    image: qrBuffer,
                    caption: rtx
                }, { quoted: m });
                setTimeout(() => {
                    try {
                        conn.sendMessage(m.key.remoteJid, { delete: qrMsg.key });
                    } catch (err) {
                        console.error('Error al eliminar QR:', err);
                    }
                }, 45000);
        }
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe)
            return;
        await handleMessage(sock, msg, sock.commands, new Map());
    });
}
const serbotCommand = {
    name: 'serbot',
    aliases: ['jadibot', 'qr', 'code'],
    category: 'owner',
    description: 'Permite a un usuario convertirse en un Sub-Bot.',
    usage: '#serbot [--code]',
    ownerOnly: true,
    async execute(sock, msg, args) {
        const sender = (msg.key.participant || msg.key.remoteJid).split('@')[0];
        const sessPath = path.join(__dirname, '../../../sessions/subbots', sender);
        if (global.conns.some(c => c.user?.id.split('@')[0] === sender)) {
            return sock.sendMessage(msg.sender, {
                text: '《✧》 Ya tienes una sesión de Sub-Bot activa.'
            }, { quoted: msg });
        }
        if (!global.db) {
            global.db = {
                data: {
                    users: {},
                    groups: {},
                    chats: {}
                }
            };
        }
        if (!global.db.data) {
            global.db.data = {
                users: {},
                groups: {},
                chats: {}
            };
        }
        if (!global.db.data.users) {
            global.db.data.users = {};
        }
        if (!global.db.data.users[msg.sender]) {
            global.db.data.users[msg.sender] = {};
        }
        const lastUsed = global.db.data.users[msg.sender]?.serbotCooldown || 0;
        const timeLeft = COOLDOWN - (Date.now() - lastUsed);
        if (timeLeft > 0) {
            return sock.sendMessage(msg.sender, {
                text: `⏳ Debes esperar ${msToTime(timeLeft)} para volver a usar este comando.`
            }, { quoted: msg });
        }
        if (global.conns.length >= MAX_BOTS) {
            return sock.sendMessage(msg.sender, {
                text: '❌ No hay espacios disponibles para nuevos Sub-Bots en este momento.'
            }, { quoted: msg });
        }
        if (!fs.existsSync(sessPath)) {
            fs.mkdirSync(sessPath, { recursive: true });
        }
        try {
            await connectToWhatsApp({
                pathSession: sessPath,
                m: msg,
                conn: sock,
                command: this.name,
                usedPrefix: '#',
                args
            });
            global.db.data.users[msg.sender].serbotCooldown = Date.now();
        }
        catch (err) {
            console.error('Error starting subbot:', err);
            await sock.sendMessage(msg.sender, {
                text: '《✧》 Ocurrió un error al intentar iniciar la sesión de Sub-Bot.'
            }, { quoted: msg });
        }
    }
};
export default serbotCommand;
export const stopSerbotCommand = {
    name: 'stopbot',
    aliases: ['detenerbot'],
    category: 'owner',
    description: 'Detiene la sesión de un Sub-Bot.',
    usage: '#stopbot',
    ownerOnly: true,
    async execute(sock, msg, args) {
        const sender = (msg.key.participant || msg.key.remoteJid).split('@')[0];
        const sessPath = path.join(__dirname, '../../../sessions/subbots', sender);
        const bot = global.conns.find(c => c.user?.id.split('@')[0] === sender);
        if (!bot) {
            return sock.sendMessage(msg.sender, {
                text: '《✧》 No tienes ninguna sesión de Sub-Bot activa.'
            }, { quoted: msg });
        }
        try {
            await bot.logout();
            global.conns = global.conns.filter(c => c.user?.id.split('@')[0] !== sender);
            fs.rm(sessPath, { recursive: true, force: true }, (err) => {
                if (err)
                    console.error('Error removing session:', err);
            });
            await sock.sendMessage(msg.sender, {
                text: '✅ Tu sesión de Sub-Bot ha sido detenida y eliminada.'
            }, { quoted: msg });
        }
        catch (err) {
            console.error('Error stopping subbot:', err);
            await sock.sendMessage(msg.sender, {
                text: '❌ Ocurrió un error al detener el Sub-Bot.'
            }, { quoted: msg });
        }
    }
};