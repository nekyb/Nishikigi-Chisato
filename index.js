import {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    makeWASocket,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
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
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            // Configuraciones adicionales para mejorar la estabilidad
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: false,
            fireInitQueries: true,
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
                console.log(chalk.yellow('\n⏳ Esperando escaneo...\n'));
            }
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(chalk.red('❌ Conexión cerrada.'));
                console.log(chalk.yellow(`Código de estado: ${statusCode}`));
                console.log(chalk.yellow(`Razón: ${lastDisconnect?.error?.message || 'Desconocida'}`));
                
                if (shouldReconnect) {
                    console.log(chalk.cyan('🔄 Reconectando en 5 segundos...'));
                    setTimeout(() => {
                        startBot();
                    }, 5000);
                } else {
                    console.log(chalk.red('🚫 Sesión cerrada. Elimina la carpeta auth_info y vuelve a escanear el QR.'));
                }
            }
            else if (connection === 'connecting') {
                console.log(chalk.yellow('🔌 Conectando...'));
            }
            else if (connection === 'open') {
                console.log(chalk.green('✅ Conectado exitosamente!'));
                console.log(chalk.cyan(`🤖 Bot: ${config.botName}`));
                console.log(chalk.cyan(`📞 Owner: ${config.ownerNumber}`));
                console.log(chalk.cyan(`⚡ Prefijo: ${config.prefix}\n`));
                
                // Cargar comandos solo cuando la conexión está abierta
                commands = await loadCommands();
                console.log(chalk.blue(`📦 ${commands.size} comandos cargados\n`));
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
                } catch (error) {
                    console.error(chalk.red('Error procesando mensaje:'), error);
                }
            }
        });

        sock.ev.on('group-participants.update', async (update) => {
            try {
                await handleEvents(sock, update, events);
            } catch (error) {
                console.error(chalk.red('Error en evento de participantes:'), error);
            }
        });

        sock.ev.on('groups.update', async (updates) => {
            try {
                for (const update of updates) {
                    await handleEvents(sock, { ...update, type: 'group-update' }, events);
                }
            } catch (error) {
                console.error(chalk.red('Error en evento de grupos:'), error);
            }
        });

        return sock;
    } catch (error) {
        console.error(chalk.red('Error en startBot:'), error);
        console.log(chalk.yellow('🔄 Reintentando en 10 segundos...'));
        setTimeout(() => {
            startBot();
        }, 10000);
    }
}

console.log(chalk.magenta(`
╔══════════════════════════════════╗
║   🐋 ORCALERO ORCALA 2.0 🐋     ║
║   Developed by DeltaByte ⚡      ║
╚══════════════════════════════════╝
`));

console.log(chalk.cyan('🚀 Iniciando bot...\n'));

startBot().catch((err) => {
    console.error(chalk.red('Error crítico iniciando el bot:'), err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error(chalk.red('Uncaught Exception:'), err);
});

process.on('unhandledRejection', (err) => {
    console.error(chalk.red('Unhandled Rejection:'), err);
});

export { sock, commands, events };