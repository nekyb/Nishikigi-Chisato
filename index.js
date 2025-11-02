import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, proto, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import { config } from './config/bot.js';
import { loadCommands } from './handlers/commands.js';
import { handleMessage } from './handlers/messages.js';
import { handleEvents } from './handlers/events.js';
import { registerUser, checkUserRegistered } from './database/users.js';
import makeWASocketLegacy, { useMultiFileAuthState as useLegacyAuth } from '@adiwajshing/baileys'

const logger = pino({
    level: process.env.LOG_LEVEL || 'silent'
});

let sock;
let commands = new Map();
let events = new Map();

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            return proto.Message.fromObject({});
        }
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log(chalk.yellow('\n📱 Escanea el código QR:\n'));
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('❌ Conexión cerrada. Reconectando...'), shouldReconnect);
            if (shouldReconnect) {
                await startBot();
            }
        }
        else if (connection === 'open') {
            console.log(chalk.green('✅ Conectado exitosamente!'));
            console.log(chalk.cyan(`🤖 Bot: ${config.botName}`));
            console.log(chalk.cyan(`📞 Owner: ${config.ownerNumber}`));
            console.log(chalk.cyan(`⚡ Prefijo: ${config.prefix}\n`));
            commands = await loadCommands();
            console.log(chalk.blue(`📦 ${commands.size} comandos cargados`));
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify')
            return;
        for (const m of messages) {
            if (!m.message)
                continue;
            if (m.key.fromMe)
                continue;
            const msg = {
                key: m.key,
                message: m.message,
                messageTimestamp: m.messageTimestamp,
                pushName: m.pushName || 'Usuario',
                quoted: m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null
            };
            try {
                const senderId = m.key.participant || m.key.remoteJid || '';
                const userId = senderId.split('@')[0];
                const isRegistered = await checkUserRegistered(userId);
                if (!isRegistered) {
                    await registerUser({
                        userId,
                        name: msg.pushName,
                        registeredAt: new Date().toISOString()
                    });
                    logger.info(`Nuevo usuario registrado: ${msg.pushName} (${userId})`);
                }
                await handleMessage(sock, msg, commands, events);
            }
            catch (error) {
                console.error('Error procesando mensaje:', error);
            }
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        await handleEvents(sock, update, events);
    });

    sock.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            await handleEvents(sock, { ...update, type: 'group-update' }, events);
        }
    });

    return sock;
}

console.log(chalk.magenta(`
╔══════════════════════════════════╗
║   🐋 ORCALERO ORCALA 2.0 🐋     ║
║   Developed by DeltaByte ⚡      ║
╚══════════════════════════════════╝
`));

startBot().catch((err) => {
    console.error(chalk.red('Error iniciando el bot:'), err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

export { sock, commands, events };