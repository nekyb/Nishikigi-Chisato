import pkg from '@soblend/baileys';
const { useMultiFileAuthState, DisconnectReason, Browsers, makeWASocket, fetchLatestBaileysVersion } = pkg;
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import { config } from './config/bot.js';
import { loadCommands } from './handlers/commands.js';
import { handleMessage } from './handlers/messages.js';
import { handleEvents } from './handlers/events.js';
import { registerUser, checkUserRegistered } from './database/users.js';

const logger = pino({
    level: process.env.LOG_LEVEL || 'silent'
});

let sock;
let commands = new Map();
let events = new Map();

async function startBot() {
    try {
        // Obtener la última versión de Baileys
        const { version } = await fetchLatestBaileysVersion();
        
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        
        sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
            connectTimeoutMs: 30000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 25000,
            emitOwnEvents: false,
            fireInitQueries: false,
            syncFullHistory: false,
            getMessage: async (key) => {
                return { conversation: '' };
            }
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log(chalk.yellow('\n📱 Escanea el código QR:\n'));
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    console.log(chalk.cyan('🔄 Reconectando...'));
                    setTimeout(() => startBot(), 5000);
                } else {
                    console.log(chalk.red('🚫 Sesión cerrada. Elimina la carpeta auth_info y vuelve a escanear el QR.'));
                }
            }
            else if (connection === 'open') {
                console.log(chalk.green(`✅ ${config.botName} conectado | Prefijo: ${config.prefix} | ${(commands = await loadCommands()).size} comandos`));
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            
            for (const m of messages) {
                if (!m.message) continue;
                if (m.key.fromMe) continue;
                
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
                    
                    if (!(await checkUserRegistered(userId))) {
                        await registerUser({
                            userId,
                            name: msg.pushName,
                            registeredAt: new Date().toISOString()
                        });
                    }
                    
                    await handleMessage(sock, msg, commands, events);
                } catch (error) {
                    console.error(chalk.red('Error:'), error.message);
                }
            }
        });

        sock.ev.on('group-participants.update', async (update) => {
            try {
                await handleEvents(sock, update, events);
            } catch (error) {
                console.error(chalk.red('Error:'), error.message);
            }
        });

        sock.ev.on('groups.update', async (updates) => {
            try {
                for (const update of updates) {
                    await handleEvents(sock, { ...update, type: 'group-update' }, events);
                }
            } catch (error) {
                console.error(chalk.red('Error:'), error.message);
            }
        });

        return sock;
    } catch (error) {
        console.error(chalk.red('Error crítico:'), error.message);
        console.log(chalk.yellow('🔄 Reintentando en 10 segundos...'));
        setTimeout(() => startBot(), 10000);
    }
}

console.log(chalk.magenta(`
╔══════════════════════════════════╗
║  Nishikigi Chisato Bot v2.0.1   ║
║   Developed by DeltaByte ⚡      ║
╚══════════════════════════════════╝
`));

startBot().catch((err) => {
    console.error(chalk.red('Error crítico iniciando el bot:'), err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error(chalk.red('Error crítico:'), err.message);
});

process.on('unhandledRejection', (err) => {
    console.error(chalk.red('Error:'), err.message || err);
});

export { sock, commands, events };