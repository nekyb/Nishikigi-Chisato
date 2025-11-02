import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, Browsers } from "@whiskeysockets/baileys"
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import * as ws from 'ws'
import { fileURLToPath } from 'url'
import { makeWASocket } from '../lib/simple.js'

const { CONNECTING } = ws
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const maxSubBots = 500
let blackJBOptions = {}
if (!global.conns) global.conns = []

function msToTime(duration) {
    const seconds = Math.floor((duration / 1000) % 60)
    const minutes = Math.floor((duration / (1000 * 60)) % 60)
    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes
    const paddedSeconds = seconds < 10 ? '0' + seconds : seconds
    return `${paddedMinutes}m ${paddedSeconds}s`
}

const jadibotCommand = {
    name: 'serbot',
    aliases: ['jadibot', 'qr', 'code', 'subbot'],
    category: 'serbot',
    description: 'Conviértete en un Sub-Bot temporal',
    usage: '#serbot o #serbot --code',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        try {
            // Debug: ver estructura del mensaje
            console.log('[SERBOT DEBUG] Iniciando comando...');
            console.log('[SERBOT DEBUG] msg.key:', JSON.stringify(msg.key, null, 2));
            console.log('[SERBOT DEBUG] msg.sender:', msg.sender);
            console.log('[SERBOT DEBUG] msg.chatId:', msg.chatId);
            
            // Obtener chatId y sender de forma segura
            const chatId = msg.key?.remoteJid || msg.chatId;
            let sender = msg.sender || msg.key?.participant || msg.key?.remoteJid;
            
            // Si sender sigue sin definirse, extraerlo del chatId
            if (!sender) {
                if (chatId?.endsWith('@g.us')) {
                    console.error('[SERBOT] No se pudo identificar al remitente en grupo');
                    return await sock.sendMessage(chatId, {
                        text: '《✧》 Error: No se pudo identificar al usuario. Por favor intenta de nuevo.'
                    }, { quoted: msg });
                } else {
                    sender = chatId;
                }
            }
            
            if (!sender) {
                console.error('[SERBOT] No se pudo identificar al remitente');
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error: No se pudo identificar al usuario.'
                }, { quoted: msg });
            }

            console.log('[SERBOT DEBUG] sender final:', sender);
            console.log('[SERBOT DEBUG] chatId final:', chatId);

            // Inicializar DB
            if (!global.db) global.db = { data: { users: {}, chats: {}, settings: {} } };
            if (!global.db.data) global.db.data = { users: {}, chats: {}, settings: {} };
            if (!global.db.data.users) global.db.data.users = {};
            if (!global.db.data.settings) global.db.data.settings = {};
            if (!global.db.data.settings[sock.user.jid]) {
                global.db.data.settings[sock.user.jid] = { jadibotmd: true };
            }

            // Verificar si está habilitado
            if (!global.db.data.settings[sock.user.jid].jadibotmd) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 El comando de Sub-Bot está desactivado temporalmente.'
                }, { quoted: msg });
            }

            // Cooldown
            const cooldownTime = 120000;
            if (!global.db.data.users[sender]) {
                global.db.data.users[sender] = { Subs: 0 };
            }
            
            const userCooldown = global.db.data.users[sender].Subs || 0;
            const timeLeft = userCooldown + cooldownTime - Date.now();

            if (timeLeft > 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 Debes esperar ${msToTime(timeLeft)} para volver a vincular un Sub-Bot.`
                }, { quoted: msg });
            }

            // Contar Sub-Bots activos
            const subBots = [...new Set(
                global.conns.filter(c =>
                    c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED
                ).map(c => c)
            )];

            const subBotsCount = subBots.length;

            if (subBotsCount >= maxSubBots) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No hay espacios disponibles para Sub-Bots en este momento.\n\n' +
                        `📊 *Sub-Bots activos:* ${subBotsCount} / ${maxSubBots}`
                }, { quoted: msg });
            }

            // Preparar directorios
            const who = msg.mentionedJid?.[0] || (msg.key?.fromMe ? sock.user.jid : sender);
            
            if (!who || typeof who !== 'string') {
                console.error('[SERBOT] Usuario inválido:', who);
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al procesar el comando.'
                }, { quoted: msg });
            }
            
            const id = who.includes('@') ? who.split('@')[0] : who;
            console.log('[SERBOT DEBUG] ID extraído:', id);
            
            const pathblackJadiBot = path.join(process.cwd(), 'SubBots', id);
            
            if (!fs.existsSync(pathblackJadiBot)) {
                fs.mkdirSync(pathblackJadiBot, { recursive: true });
            }
            
            blackJBOptions.pathblackJadiBot = pathblackJadiBot;
            blackJBOptions.m = msg;
            blackJBOptions.conn = sock;
            blackJBOptions.args = args;
            blackJBOptions.usedPrefix = '#';
            blackJBOptions.command = 'serbot';
            blackJBOptions.fromCommand = true;
            blackJBOptions.sender = sender;
            blackJBOptions.chatId = chatId;

            console.log('[SERBOT] Iniciando blackJadiBot...');
            await blackJadiBot(blackJBOptions);

            // Actualizar cooldown
            global.db.data.users[sender].Subs = Date.now();
            
        } catch (error) {
            console.error('[SERBOT] Error en execute:', error);
            console.error('[SERBOT] Stack:', error.stack);
            const chatId = msg.key?.remoteJid || msg.chatId;
            if (chatId) {
                try {
                    await sock.sendMessage(chatId, {
                        text: '《✧》 Error al procesar el comando.\n\n' +
                            `Error: ${error.message}`
                    }, { quoted: msg });
                } catch (e) {
                    console.error('[SERBOT] No se pudo enviar mensaje de error:', e);
                }
            }
        }
    }
};

export default jadibotCommand;

export async function blackJadiBot(options) {
    let { pathblackJadiBot, m, conn, args, usedPrefix, command, sender, chatId } = options;
    
    console.log('[JADIBOT] Iniciando conexión...');

    // Fallback para sender y chatId
    if (!sender) {
        sender = m.key?.participant || m.key?.remoteJid || m.sender;
    }
    if (!chatId) {
        chatId = m.key?.remoteJid || m.chatId || m.chat;
    }
    
    // Detectar modo código
    const mcode = args.some(arg => /(--code|code)/.test(arg?.trim()));
    
    let txtCode, codeBot, txtQR;
    const pathCreds = path.join(pathblackJadiBot, "creds.json");
    
    if (!fs.existsSync(pathblackJadiBot)) {
        fs.mkdirSync(pathblackJadiBot, { recursive: true });
    }

    // Cargar credenciales
    try {
        if (args[0] && args[0] != undefined && !/(--code|code)/.test(args[0])) {
            fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t'));
        }
    } catch (error) {
        await conn.sendMessage(chatId, {
            text: `《✧》 Use correctamente el comando: ${usedPrefix}${command}`
        }, { quoted: m });
        return;
    }

    try {
        const { version } = await fetchLatestBaileysVersion();
        const msgRetry = () => {};
        const msgRetryCache = new NodeCache();
        const { state, saveState, saveCreds } = await useMultiFileAuthState(pathblackJadiBot);

        const connectionOptions = {
            logger: pino({ level: "fatal" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            msgRetry,
            msgRetryCache,
            browser: mcode ? Browsers.macOS("Chrome") : Browsers.macOS("Desktop"),
            version: version,
            generateHighQualityLinkPreview: true
        };

        let sock = makeWASocket(connectionOptions);
        sock.isInit = false;
        let isInit = true;

        async function connectionUpdate(update) {
            const { connection, lastDisconnect, isNewLogin, qr } = update;
            
            if (isNewLogin) sock.isInit = false;

            // QR
            if (qr && !mcode) {
                if (chatId) {
                    const qrText = `《✧》 *Sub-Bot - Escanea el QR*\n\n` +
                        `📲 *Pasos:*\n` +
                        `✿ Abre WhatsApp\n` +
                        `✿ Menú > Dispositivos vinculados\n` +
                        `✿ Vincular un dispositivo\n` +
                        `✿ Escanea este QR\n\n` +
                        `⏳ *Expira en 45 segundos*\n\n` +
                        `_Powered By DeltaByte_`;

                    txtQR = await conn.sendMessage(chatId, {
                        image: await qrcode.toBuffer(qr, { scale: 8 }),
                        caption: qrText
                    }, { quoted: m });
                    
                    if (txtQR?.key) {
                        setTimeout(() => conn.sendMessage(chatId, { delete: txtQR.key }), 45000);
                    }
                }
                return;
            }

            // Código
            if (qr && mcode) {
                const senderNumber = sender.split('@')[0];
                let secret = await sock.requestPairingCode(senderNumber);
                secret = secret.match(/.{1,4}/g)?.join("-");
                
                const codeText = `《✧》 *Sub-Bot - Código*\n\n` +
                    `📱 *Pasos:*\n` +
                    `✿ Abre WhatsApp\n` +
                    `✿ Menú > Dispositivos vinculados\n` +
                    `✿ Vincular con número\n` +
                    `✿ Ingresa el código\n\n` +
                    `⏳ *Expira en 45 segundos*\n\n` +
                    `_Powered By DeltaByte_`;

                txtCode = await conn.sendMessage(chatId, { text: codeText }, { quoted: m });
                codeBot = await conn.sendMessage(chatId, { text: `\`\`\`${secret}\`\`\`` }, { quoted: m });
                
                console.log(chalk.yellow(`Código: ${secret}`));
                
                if (txtCode?.key) setTimeout(() => conn.sendMessage(chatId, { delete: txtCode.key }), 45000);
                if (codeBot?.key) setTimeout(() => conn.sendMessage(chatId, { delete: codeBot.key }), 45000);
            }

            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
            
            if (connection === 'close') {
                console.log(chalk.yellow(`[SubBot] Desconectado: ${reason}`));
                
                if (reason === 428 || reason === 408) {
                    await creloadHandler(true).catch(console.error);
                } else if (reason === 405 || reason === 401) {
                    fs.rmSync(pathblackJadiBot, { recursive: true, force: true });
                } else if (reason === 500 || reason === 515) {
                    await creloadHandler(true).catch(console.error);
                } else if (reason === 403) {
                    fs.rmSync(pathblackJadiBot, { recursive: true, force: true });
                }
            }

            if (connection === 'open') {
                if (!global.db) global.db = { data: { users: {}, chats: {}, settings: {} } };
                if (!global.db.data) global.db.data = { users: {}, chats: {}, settings: {} };
                
                const userName = sock.authState?.creds?.me?.name || 'Anónimo';
                
                console.log(chalk.cyan(`\n🟢 Sub-Bot: ${userName} (+${path.basename(pathblackJadiBot)})`));
                
                sock.isInit = true;
                global.conns.push(sock);
                
                if (chatId) {
                    await conn.sendMessage(chatId, {
                        text: `《✧》 @${sender.split('@')[0]}, conectado como Sub-Bot.\n\n` +
                            `✅ *Estado:* Activo\n` +
                            `📱 *Número:* +${path.basename(pathblackJadiBot)}\n\n` +
                            `_Powered By DeltaByte_`,
                        mentions: [sender]
                    }, { quoted: m });
                }
            }
        }

        setInterval(async () => {
            if (!sock.user) {
                try { sock.ws.close(); } catch {}
                sock.ev.removeAllListeners();
                let i = global.conns.indexOf(sock);
                if (i >= 0) global.conns.splice(i, 1);
            }
        }, 60000);

        let handler = await import('../handlers/commands.js');

        let creloadHandler = async function (restatConn) {
            try {
                const Handler = await import(`../handlers/commands.js?update=${Date.now()}`).catch(console.error);
                if (Handler) handler = Handler;
                
                if (restatConn) {
                    const oldChats = sock.chats;
                    try { sock.ws.close(); } catch {}
                    sock.ev.removeAllListeners();
                    sock = makeWASocket(connectionOptions, { chats: oldChats });
                    isInit = true;
                }
                
                if (!isInit) {
                    sock.ev.off("messages.upsert", sock.handler);
                    sock.ev.off("connection.update", sock.connectionUpdate);
                    sock.ev.off('creds.update', sock.credsUpdate);
                }
                
                if (!sock.commandHandler) {
                    if (typeof handler.default === 'function') {
                        sock.commandHandler = new handler.default();
                    } else {
                        sock.commandHandler = handler;
                    }
                    if (typeof sock.commandHandler.loadCommands === 'function') {
                        await sock.commandHandler.loadCommands();
                    }
                }
                
                sock.handler = async (chatUpdate) => {
                    if (!chatUpdate.messages) return;
                    const message = chatUpdate.messages[0];
                    if (!message || message.key?.remoteJid === 'status@broadcast') return;
                    await sock.commandHandler.handleMessage(sock, message);
                };
                
                sock.connectionUpdate = connectionUpdate.bind(sock);
                sock.credsUpdate = saveCreds.bind(sock, true);
                
                sock.ev.on("messages.upsert", sock.handler);
                sock.ev.on("connection.update", sock.connectionUpdate);
                sock.ev.on("creds.update", sock.credsUpdate);
                
                isInit = false;
                return true;
            } catch (e) {
                console.error('Error en creloadHandler:', e);
                throw e;
            }
        };

        sock.ev.on('connection.update', connectionUpdate);
        sock.ev.on('creds.update', saveCreds);

        await creloadHandler(false);
        
        return sock;

    } catch (error) {
        console.error('Error en blackJadiBot:', error);
        throw error;
    }
}