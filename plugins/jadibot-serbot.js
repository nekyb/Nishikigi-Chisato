
import pkg from "@soblend/baileys";
const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, Browsers, makeWASocket: makeWASocketBaileys } = pkg;
import qrcode from "qrcode";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import pino from 'pino';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { handleMessage } from '../handlers/messages.js';
import { loadCommands } from '../handlers/commands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!global.conns) global.conns = [];
const maxSubBots = 500;

const jadibotCommand = {
    name: 'serbot',
    aliases: ['jadibot', 'qr', 'code', 'subbot'],
    category: 'serbot',
    description: 'Conviértete en un Sub-Bot temporal',
    usage: '#serbot o #serbot --code',
    adminOnly: false,
    groupOnly: false,
    ownerOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        try {
            const chatId = msg.key?.remoteJid;
            let sender = msg.key?.participant || msg.key?.remoteJid;
            if (!sender) {
                if (chatId?.endsWith('@g.us')) {
                    return await sock.sendMessage(chatId, {
                        text: '《✿》 Error: No se pudo identificar al usuario. Intenta de nuevo.'
                    }, { quoted: msg });
                } else {
                    sender = chatId;
                }
            }
            
            if (!sender || !chatId) {
                return await sock.sendMessage(chatId || sender, {
                    text: '《✿》 Error: No se pudo procesar la solicitud.'
                });
            }
            
            const userNumber = sender.split('@')[0];
            if (global.conns.length >= maxSubBots) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Límite Alcanzado*\n\n❌ Se alcanzó el límite de ${maxSubBots} sub-bots activos.\n\n⏳ Intenta más tarde.`
                }, { quoted: msg });
            }
            
            const isConnected = global.conns.some(c => {
                const connNumber = c.user?.id?.split(':')[0] || path.basename(c.pathblackJadiBot || '');
                return connNumber === userNumber;
            });
            
            if (isConnected) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Ya Conectado*\n\n✅ Ya tienes un sub-bot activo.\n\n💡 Usa #stopbot para desconectarlo.`
                }, { quoted: msg });
            }
            
            await sock.sendMessage(chatId, {
                text: `《✿》 *Iniciando Sub-Bot*\n\n⏳ Preparando conexión...\n\n_Powered By DeltaByte_`
            }, { quoted: msg });
            
            await startJadiBot({
                pathblackJadiBot: path.join(__dirname, '..', 'jadibots', userNumber),
                m: msg,
                conn: sock,
                args,
                usedPrefix: '#',
                command: 'serbot',
                sender,
                chatId
            });
            
        } catch (error) {
            console.error('[SERBOT] Error en execute:', error);
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `《✿》 *Error*\n\n❌ ${error.message}\n\n💡 Intenta nuevamente.`
                }, { quoted: msg });
            } catch (e) {
                console.error('[SERBOT] No se pudo enviar mensaje de error:', e);
            }
        }
    }
};

export default jadibotCommand;

async function startJadiBot(options) {
    let { pathblackJadiBot, m, conn, args, usedPrefix, command, sender, chatId } = options;
    console.log(chalk.cyan('[JADIBOT] Iniciando conexión...'));
    const mcode = args.some(arg => /(--code|code)/.test(arg?.trim()));
    let txtCode, codeBot, txtQR;
    const pathCreds = path.join(pathblackJadiBot, "creds.json");
    if (!fs.existsSync(pathblackJadiBot)) {
        fs.mkdirSync(pathblackJadiBot, { recursive: true });
    }

    try {
        if (args[0] && args[0] !== undefined && !/(--code|code)/.test(args[0])) {
            fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t'));
        }
    } catch (error) {
        await conn.sendMessage(chatId, {
            text: `《✿》 *Error en Credenciales*\n\n❌ Formato incorrecto.\n\n📝 Uso: ${usedPrefix}${command}`
        }, { quoted: m });
        return;
    }

    try {
        const { version } = await fetchLatestBaileysVersion();
        const msgRetry = () => {};
        const msgRetryCache = new NodeCache();
        const { state, saveCreds } = await useMultiFileAuthState(pathblackJadiBot);
        const connectionOptions = {
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            msgRetry,
            msgRetryCache,
            browser: mcode ? Browsers.macOS("Chrome") : Browsers.ubuntu("Chrome"),
            version,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            getMessage: async () => ({ conversation: '' })
        };

        let sock = makeWASocketBaileys(connectionOptions);
        sock.isInit = false;
        sock.pathblackJadiBot = pathblackJadiBot;
        let isInit = true;
        let qrRetries = 0;
        let codeRetries = 0;
        const maxRetries = 3;

        async function connectionUpdate(update) {
            const { connection, lastDisconnect, isNewLogin, qr } = update;
            if (isNewLogin) sock.isInit = false;
            if (qr && !mcode) {
                qrRetries++;
                if (qrRetries > maxRetries) {
                    await conn.sendMessage(chatId, {
                        text: `《✿》 *Error QR*\n\n❌ Demasiados intentos fallidos.\n\n💡 Intenta con código: ${usedPrefix}${command} --code`
                    }, { quoted: m });
                    try { sock.ws.close(); } catch {}
                    return;
                }
                
                if (chatId) {
                    try {
                        const qrImage = await qrcode.toBuffer(qr, { scale: 8 });
                        const qrText = `《✿》 *Sub-Bot - Escanea el QR*\n\n` +
                            `📲 *Pasos:*\n` +
                            `✿ Abre WhatsApp\n` +
                            `✿ Menú → Dispositivos vinculados\n` +
                            `✿ Vincular un dispositivo\n` +
                            `✿ Escanea este QR\n\n` +
                            `⏳ *Expira en 45 segundos*\n` +
                            `🔄 *Intento ${qrRetries}/${maxRetries}*\n\n` +
                            `💡 Usa \`${usedPrefix}${command} --code\` para código de 8 dígitos\n\n` +
                            `_Powered By DeltaByte_`;
                        if (txtQR) {
                            try {
                                await conn.sendMessage(chatId, { delete: txtQR.key });
                            } catch {}
                        }

                        txtQR = await conn.sendMessage(chatId, {
                            image: qrImage,
                            caption: qrText
                        }, { quoted: m });
                    } catch (error) {
                        console.error('[JADIBOT] Error enviando QR:', error);
                    }
                }
            }

            if (connection === 'open' && mcode && !sock.authState?.creds?.registered) {
                codeRetries++;
                if (codeRetries > maxRetries) {
                    await conn.sendMessage(chatId, {
                        text: `《✿》 *Error Código*\n\n❌ Demasiados intentos fallidos.\n\n💡 Intenta con QR: ${usedPrefix}${command}`
                    }, { quoted: m });
                    try { sock.ws.close(); } catch {}
                    return;
                }
                
                try {
                    let phoneNumber = sender.split('@')[0];
                    codeBot = await sock.requestPairingCode(phoneNumber);
                    codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
                    const codeText = `《✿》 *Sub-Bot - Código de Vinculación*\n\n` +
                        `🔐 *Tu código:*\n\n` +
                        `\`\`\`${codeBot}\`\`\`\n\n` +
                        `📲 *Pasos:*\n` +
                        `✿ Abre WhatsApp\n` +
                        `✿ Menú → Dispositivos vinculados\n` +
                        `✿ Vincular con número de teléfono\n` +
                        `✿ Ingresa el código\n\n` +
                        `⏳ *Expira en 60 segundos*\n` +
                        `🔄 *Intento ${codeRetries}/${maxRetries}*\n\n` +
                        `_Powered By DeltaByte_`;
                    if (txtCode) {
                        try {
                            await conn.sendMessage(chatId, { delete: txtCode.key });
                        } catch {}
                    }
                    
                    txtCode = await conn.sendMessage(chatId, {
                        text: codeText
                    }, { quoted: m });
                } catch (error) {
                    console.error('[JADIBOT] Error generando código:', error);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const reason = lastDisconnect?.error?.output?.payload?.error;
                console.log(chalk.yellow(`[JADIBOT] Desconectado: ${statusCode} - ${reason}`));
                if (txtQR) {
                    try { await conn.sendMessage(chatId, { delete: txtQR.key }); } catch {}
                }
                if (txtCode) {
                    try { await conn.sendMessage(chatId, { delete: txtCode.key }); } catch {}
                }
                
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect && qrRetries <= maxRetries && codeRetries <= maxRetries) {
                    console.log(chalk.cyan('[JADIBOT] Reconectando...'));
                    setTimeout(() => startJadiBot(options), 5000);
                } else {
                    let i = global.conns.indexOf(sock);
                    if (i >= 0) global.conns.splice(i, 1);
                    if (statusCode === DisconnectReason.loggedOut) {
                        try {
                            fs.rmSync(pathblackJadiBot, { recursive: true, force: true });
                        } catch {}
                        await conn.sendMessage(chatId, {
                            text: `《✿》 *Sesión Cerrada*\n\n❌ Se cerró la sesión del sub-bot.\n\n💡 Usa ${usedPrefix}${command} para crear uno nuevo.`
                        }, { quoted: m });
                    } else {
                        await conn.sendMessage(chatId, {
                            text: `《✿》 *Conexión Fallida*\n\n❌ No se pudo establecer conexión.\n\n💡 Intenta nuevamente.`
                        }, { quoted: m });
                    }
                }
            }

            if (connection === 'open') {
                const userName = sock.authState?.creds?.me?.name || sock.user?.name || 'Anónimo';
                const userPhone = sock.user?.id?.split(':')[0] || sender.split('@')[0];
                console.log(chalk.green(`\n✅ Sub-Bot: ${userName} (+${userPhone})`));
                sock.isInit = true;
                if (!global.conns.includes(sock)) {
                    global.conns.push(sock);
                }

                if (txtQR) {
                    try { await conn.sendMessage(chatId, { delete: txtQR.key }); } catch {}
                }
                if (txtCode) {
                    try { await conn.sendMessage(chatId, { delete: txtCode.key }); } catch {}
                }
                
                await conn.sendMessage(chatId, {
                    text: `《✿》 *Sub-Bot Conectado*\n\n` +
                        `✅ *Estado:* Activo\n` +
                        `📱 *Número:* +${userPhone}\n` +
                        `👤 *Usuario:* ${userName}\n` +
                        `🤖 *Bots activos:* ${global.conns.length}/${maxSubBots}\n\n` +
                        `💡 Usa ${usedPrefix}stopbot para desconectar\n\n` +
                        `_Powered By DeltaByte_`,
                    mentions: [sender]
                }, { quoted: m });
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
        let commands = await loadCommands();
        let events = new Map();
        async function handler({ messages }) {
            if (!messages || messages.length === 0) return;
            
            for (const msg of messages) {
                if (!msg.message) continue;
                if (msg.key.fromMe) continue;
                try {
                    await handleMessage(sock, msg, commands, events);
                } catch (error) {
                    console.error('[JADIBOT] Error en handler:', error);
                }
            }
        }

        async function reloadHandler(restart) {
            try {
                const Handler = await import(`../handlers/messages.js?update=${Date.now()}`);
                commands = await loadCommands();
                if (restart) {
                    sock.ev.off('messages.upsert', handler);
                    sock.ev.off('connection.update', connectionUpdate);
                    sock.ev.off('creds.update', saveCreds);
                }
                
                sock.ev.on('messages.upsert', handler);
                sock.ev.on('connection.update', connectionUpdate);
                sock.ev.on('creds.update', saveCreds);
                return true;
            } catch (error) {
                console.error('[JADIBOT] Error recargando handler:', error);
                return false;
            }
        }

        await reloadHandler(false);
    } catch (error) {
        console.error('[JADIBOT] Error crítico:', error);
        await conn.sendMessage(chatId, {
            text: `《✧》 *Error Crítico*\n\n❌ ${error.message}\n\n💡 Contacta al desarrollador si persiste.`
        }, { quoted: m });
    }
}
