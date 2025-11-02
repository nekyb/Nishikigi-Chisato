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



const { CONNECTING } = wsconst { CONNECTING } = ws

const __filename = fileURLToPath(import.meta.url)const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)const __dirname = path.dirname(__filename)

const maxSubBots = 500const maxSubBots = 500

let blackJBOptions = {}let blackJBOptions = {}

if (!global.conns) global.conns = []if (!global.conns) global.conns = []

function msToTime(duration) {

function msToTime(duration) {    const seconds = Math.floor((duration / 1000) % 60)

    const seconds = Math.floor((duration / 1000) % 60)    const minutes = Math.floor((duration / (1000 * 60)) % 60)

    const minutes = Math.floor((duration / (1000 * 60)) % 60)    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes

    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes    const paddedSeconds = seconds < 10 ? '0' + seconds : seconds

    const paddedSeconds = seconds < 10 ? '0' + seconds : seconds    return `${paddedMinutes}m ${paddedSeconds}s`}

    return `${paddedMinutes}m ${paddedSeconds}s`

}const jadibotCommand = {

    name: 'serbot',

const jadibotCommand = {    aliases: ['jadibot', 'qr', 'code', 'subbot'],

    name: 'serbot',    category: 'serbot',

    aliases: ['jadibot', 'qr', 'code', 'subbot'],    description: 'Conviértete en un Sub-Bot temporal',

    category: 'serbot',    usage: '#serbot o #serbot --code',

    description: 'Conviértete en un Sub-Bot temporal',    adminOnly: false,

    usage: '#serbot o #serbot --code',    groupOnly: false,

    adminOnly: false,    botAdminRequired: false,

    groupOnly: false,    async execute(sock, msg, args) {

    botAdminRequired: false,        try {

    async execute(sock, msg, args) {            // Debug: ver estructura del mensaje

        try {            console.log('[SERBOT DEBUG] Iniciando comando...');

            console.log('[SERBOT DEBUG] Iniciando comando...');            console.log('[SERBOT DEBUG] msg.key:', JSON.stringify(msg.key, null, 2));

            console.log('[SERBOT DEBUG] msg.key:', JSON.stringify(msg.key, null, 2));            console.log('[SERBOT DEBUG] msg.sender:', msg.sender);

            console.log('[SERBOT DEBUG] msg.sender:', msg.sender);            console.log('[SERBOT DEBUG] msg.chatId:', msg.chatId);

            console.log('[SERBOT DEBUG] msg.chatId:', msg.chatId);            

                        // Obtener chatId y sender de forma segura

            const chatId = msg.key?.remoteJid || msg.chatId;            const chatId = msg.key?.remoteJid || msg.chatId;

            let sender = msg.sender || msg.key?.participant || msg.key?.remoteJid;            let sender = msg.sender || msg.key?.participant || msg.key?.remoteJid;

                        

            if (!sender) {            // Si sender sigue sin definirse, extraerlo del chatId

                if (chatId?.endsWith('@g.us')) {            if (!sender) {

                    console.error('[SERBOT] No se pudo identificar al remitente en grupo');                if (chatId?.endsWith('@g.us')) {

                    return await sock.sendMessage(chatId, {                    console.error('[SERBOT] No se pudo identificar al remitente en grupo');

                        text: '《✧》 Error: No se pudo identificar al usuario. Por favor intenta de nuevo.'                    return await sock.sendMessage(chatId, {

                    }, { quoted: msg });                        text: '《✧》 Error: No se pudo identificar al usuario. Por favor intenta de nuevo.'

                } else {                    }, { quoted: msg });

                    sender = chatId;                } else {

                }                    sender = chatId;

            }                }

                        }

            if (!sender) {            

                console.error('[SERBOT] No se pudo identificar al remitente');            if (!sender) {

                return await sock.sendMessage(chatId, {                console.error('[SERBOT] No se pudo identificar al remitente');

                    text: '《✧》 Error: No se pudo identificar al usuario.'                return await sock.sendMessage(chatId, {

                }, { quoted: msg });                    text: '《✧》 Error: No se pudo identificar al usuario.'

            }                }, { quoted: msg });

                        }

            console.log('[SERBOT DEBUG] sender final:', sender);            

            console.log('[SERBOT DEBUG] chatId final:', chatId);            console.log('[SERBOT DEBUG] sender final:', sender);

            console.log('[SERBOT DEBUG] chatId final:', chatId);

            if (!global.db) global.db = { data: { users: {}, chats: {}, settings: {} } };

            if (!global.db.data) global.db.data = { users: {}, chats: {}, settings: {} };            // Inicializar DB

            if (!global.db.data.users) global.db.data.users = {};            if (!global.db) global.db = { data: { users: {}, chats: {}, settings: {} } };

            if (!global.db.data.settings) global.db.data.settings = {};            if (!global.db.data) global.db.data = { users: {}, chats: {}, settings: {} };

            if (!global.db.data.settings[sock.user.jid]) {            if (!global.db.data.users) global.db.data.users = {};

                global.db.data.settings[sock.user.jid] = { jadibotmd: true };            if (!global.db.data.settings) global.db.data.settings = {};

            }            if (!global.db.data.settings[sock.user.jid]) {

                global.db.data.settings[sock.user.jid] = { jadibotmd: true };

            if (!global.db.data.settings[sock.user.jid].jadibotmd) {            }

                return await sock.sendMessage(chatId, {

                    text: '《✧》 El comando de Sub-Bot está desactivado temporalmente.'            // Verificar si está habilitado

                }, { quoted: msg });            if (!global.db.data.settings[sock.user.jid].jadibotmd) {

            }                return await sock.sendMessage(chatId, {

                    text: '《✧》 El comando de Sub-Bot está desactivado temporalmente.'

            const cooldownTime = 120000;                }, { quoted: msg });

            if (!global.db.data.users[sender]) {            }

                global.db.data.users[sender] = { Subs: 0 };

            }            // Cooldown

                        const cooldownTime = 120000;

            const userCooldown = global.db.data.users[sender].Subs || 0;            if (!global.db.data.users[sender]) {

            const timeLeft = userCooldown + cooldownTime - Date.now();                global.db.data.users[sender] = { Subs: 0 };

            }

            if (timeLeft > 0) {            

                return await sock.sendMessage(chatId, {            const userCooldown = global.db.data.users[sender].Subs || 0;

                    text: `《✧》 Debes esperar ${msToTime(timeLeft)} para volver a vincular un Sub-Bot.`            const timeLeft = userCooldown + cooldownTime - Date.now();

                }, { quoted: msg });

            }            if (timeLeft > 0) {

                return await sock.sendMessage(chatId, {

            const subBots = [...new Set(                    text: `《✧》 Debes esperar ${msToTime(timeLeft)} para volver a vincular un Sub-Bot.`

                global.conns.filter(c =>                }, { quoted: msg });

                    c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED            }

                ).map(c => c)

            )];            // Contar Sub-Bots activos

            const subBots = [...new Set(

            const subBotsCount = subBots.length;                global.conns.filter(c =>

                    c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED

            if (subBotsCount >= maxSubBots) {                ).map(c => c)

                return await sock.sendMessage(chatId, {            )];

                    text: '《✧》 No hay espacios disponibles para Sub-Bots en este momento.\n\n' +

                        `📊 *Sub-Bots activos:* ${subBotsCount} / ${maxSubBots}`            const subBotsCount = subBots.length;

                }, { quoted: msg });

            }            if (subBotsCount >= maxSubBots) {

                return await sock.sendMessage(chatId, {

            const who = msg.mentionedJid?.[0] || (msg.key?.fromMe ? sock.user.jid : sender);                    text: '《✧》 No hay espacios disponibles para Sub-Bots en este momento.\n\n' +

                                    `📊 *Sub-Bots activos:* ${subBotsCount} / ${maxSubBots}`

            if (!who || typeof who !== 'string') {                }, { quoted: msg });

                console.error('[SERBOT] Usuario inválido:', who);            }

                return await sock.sendMessage(chatId, {

                    text: '《✧》 Error al procesar el comando.'            // Preparar directorios

                }, { quoted: msg });            const who = msg.mentionedJid?.[0] || (msg.key?.fromMe ? sock.user.jid : sender);

            }            

                        if (!who || typeof who !== 'string') {

            const id = who.includes('@') ? who.split('@')[0] : who;                console.error('[SERBOT] Usuario inválido:', who);

            console.log('[SERBOT DEBUG] ID extraído:', id);                return await sock.sendMessage(chatId, {

                                text: '《✧》 Error al procesar el comando.'

            const pathblackJadiBot = path.join(process.cwd(), 'SubBots', id);                }, { quoted: msg });

            }

            if (!fs.existsSync(pathblackJadiBot)) {            

                fs.mkdirSync(pathblackJadiBot, { recursive: true });            const id = who.includes('@') ? who.split('@')[0] : who;

            }            console.log('[SERBOT DEBUG] ID extraído:', id);

            

            blackJBOptions.pathblackJadiBot = pathblackJadiBot;            const pathblackJadiBot = path.join(process.cwd(), 'SubBots', id);

            blackJBOptions.m = msg;

            blackJBOptions.conn = sock;            if (!fs.existsSync(pathblackJadiBot)) {

            blackJBOptions.args = args;                fs.mkdirSync(pathblackJadiBot, { recursive: true });

            blackJBOptions.usedPrefix = '#';            }

            blackJBOptions.command = 'serbot';

            blackJBOptions.fromCommand = true;            blackJBOptions.pathblackJadiBot = pathblackJadiBot;

            blackJBOptions.sender = sender;            blackJBOptions.m = msg;

            blackJBOptions.chatId = chatId;            blackJBOptions.conn = sock;

            blackJBOptions.args = args;

            console.log('[SERBOT] Iniciando blackJadiBot...');            blackJBOptions.usedPrefix = '#';

            await blackJadiBot(blackJBOptions);            blackJBOptions.command = 'serbot';

            blackJBOptions.fromCommand = true;

            global.db.data.users[sender].Subs = Date.now();            blackJBOptions.sender = sender;

                        blackJBOptions.chatId = chatId;

        } catch (error) {

            console.error('[SERBOT] Error en execute:', error);            console.log('[SERBOT] Iniciando blackJadiBot...');

            console.error('[SERBOT] Stack:', error.stack);            await blackJadiBot(blackJBOptions);

            const chatId = msg.key?.remoteJid || msg.chatId;

            if (chatId) {            // Actualizar cooldown

                try {            global.db.data.users[sender].Subs = Date.now();

                    await sock.sendMessage(chatId, {            

                        text: '《✧》 Error al procesar el comando.\n\n' +        } catch (error) {

                            `Error: ${error.message}`            console.error('[SERBOT] Error en execute:', error);

                    }, { quoted: msg });            console.error('[SERBOT] Stack:', error.stack);

                } catch (e) {            const chatId = msg.key?.remoteJid || msg.chatId;

                    console.error('[SERBOT] No se pudo enviar mensaje de error:', e);            if (chatId) {

                }                try {

            }                    await sock.sendMessage(chatId, {

        }                        text: '《✧》 Error al procesar el comando.\n\n' +

    }                            `Error: ${error.message}`

};                    }, { quoted: msg });

                } catch (e) {

export default jadibotCommand;                    console.error('[SERBOT] No se pudo enviar mensaje de error:', e);

                }

export async function blackJadiBot(options) {            }

    let { pathblackJadiBot, m, conn, args, usedPrefix, command, sender, chatId } = options;        }

        }

    console.log('[JADIBOT] Iniciando conexión...');};

    

    if (!sender) {export default jadibotCommand;

        sender = m.key?.participant || m.key?.remoteJid || m.sender;

    }export async function blackJadiBot(options) {

    if (!chatId) {    let { pathblackJadiBot, m, conn, args, usedPrefix, command, sender, chatId } = options;

        chatId = m.key?.remoteJid || m.chatId || m.chat;    

    }    console.log('[JADIBOT] Iniciando conexión...');

        

    const mcode = args.some(arg => /(--code|code)/.test(arg?.trim()));    // Fallback para sender y chatId

        if (!sender) {

    let txtCode, codeBot, txtQR;        sender = m.key?.participant || m.key?.remoteJid || m.sender;

    const pathCreds = path.join(pathblackJadiBot, "creds.json");    }

        if (!chatId) {

    if (!fs.existsSync(pathblackJadiBot)) {        chatId = m.key?.remoteJid || m.chatId || m.chat;

        fs.mkdirSync(pathblackJadiBot, { recursive: true });    }

    }    

    // Detectar modo código

    try {    const mcode = args.some(arg => /(--code|code)/.test(arg?.trim()));

        if (args[0] && args[0] != undefined && !/(--code|code)/.test(args[0])) {    

            fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t'));    let txtCode, codeBot, txtQR;

        }    const pathCreds = path.join(pathblackJadiBot, "creds.json");

    } catch (error) {    

        await conn.sendMessage(chatId, {    if (!fs.existsSync(pathblackJadiBot)) {

            text: `《✧》 Use correctamente el comando: ${usedPrefix}${command}`        fs.mkdirSync(pathblackJadiBot, { recursive: true });

        }, { quoted: m });    }

        return;

    }    // Cargar credenciales

    try {

    try {        if (args[0] && args[0] != undefined && !/(--code|code)/.test(args[0])) {

        const { version } = await fetchLatestBaileysVersion();            fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t'));

        const msgRetry = () => {};        }

        const msgRetryCache = new NodeCache();    } catch (error) {

        const { state, saveState, saveCreds } = await useMultiFileAuthState(pathblackJadiBot);        await conn.sendMessage(chatId, {

            text: `《✧》 Use correctamente el comando: ${usedPrefix}${command}`

        const connectionOptions = {        }, { quoted: m });

            logger: pino({ level: "fatal" }),        return;

            printQRInTerminal: false,    }

            auth: { 

                creds: state.creds,     const { version } = await fetchLatestBaileysVersion();

                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))    const msgRetry = () => {};

            },    const msgRetryCache = new NodeCache();

            msgRetry,    const { state, saveState, saveCreds } = await useMultiFileAuthState(pathblackJadiBot);

            msgRetryCache,

            browser: mcode ? Browsers.macOS("Chrome") : Browsers.macOS("Desktop"),    const connectionOptions = {

            version: version,        logger: pino({ level: "fatal" }),

            generateHighQualityLinkPreview: true        printQRInTerminal: false,

        };        auth: { 

            creds: state.creds, 

        let sock = makeWASocket(connectionOptions);            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))

        sock.isInit = false;        },

        let isInit = true;        msgRetry,

        msgRetryCache,

        async function connectionUpdate(update) {        browser: mcode ? Browsers.macOS("Chrome") : Browsers.macOS("Desktop"),

            try {        version: version,

                const { connection, lastDisconnect, isNewLogin, qr } = update;        generateHighQualityLinkPreview: true

                    };

                if (isNewLogin) sock.isInit = false;

    let sock = makeWASocket(connectionOptions);

                if (qr && !mcode) {    sock.isInit = false;

                    if (chatId) {    let isInit = true;

                        const qrText = `《✧》 *Sub-Bot - Escanea el QR*\n\n` +

                            `📲 *Pasos:*\n` +    async function connectionUpdate(update) {

                            `✿ Abre WhatsApp\n` +        const { connection, lastDisconnect, isNewLogin, qr } = update;

                            `✿ Menú > Dispositivos vinculados\n` +        

                            `✿ Vincular un dispositivo\n` +        if (isNewLogin) sock.isInit = false;

                            `✿ Escanea este QR\n\n` +

                            `⏳ *Expira en 45 segundos*\n\n` +        // QR

                            `_Powered By DeltaByte_`;        if (qr && !mcode) {

            if (chatId) {

                        txtQR = await conn.sendMessage(chatId, {                const qrText = `《✧》 *Sub-Bot - Escanea el QR*\n\n` +

                            image: await qrcode.toBuffer(qr, { scale: 8 }),                    `📲 *Pasos:*\n` +

                            caption: qrText                    `✿ Abre WhatsApp\n` +

                        }, { quoted: m });                    `✿ Menú > Dispositivos vinculados\n` +

                    `✿ Vincular un dispositivo\n` +

                        if (txtQR?.key) {                    `✿ Escanea este QR\n\n` +

                            setTimeout(() => conn.sendMessage(chatId, { delete: txtQR.key }), 45000);                    `⏳ *Expira en 45 segundos*\n\n` +

                        }                    `_Powered By DeltaByte_`;

                    }

                    return;                txtQR = await conn.sendMessage(chatId, {

                }                    image: await qrcode.toBuffer(qr, { scale: 8 }),

                    caption: qrText

                if (qr && mcode) {                }, { quoted: m });

                    const senderNumber = sender.split('@')[0];

                    let secret = await sock.requestPairingCode(senderNumber);                if (txtQR?.key) {

                    secret = secret.match(/.{1,4}/g)?.join("-");                    setTimeout(() => conn.sendMessage(chatId, { delete: txtQR.key }), 45000);

                                    }

                    const codeText = `《✧》 *Sub-Bot - Código*\n\n` +            }

                        `📱 *Pasos:*\n` +            return;

                        `✿ Abre WhatsApp\n` +        }

                        `✿ Menú > Dispositivos vinculados\n` +

                        `✿ Vincular con número\n` +        // Código

                        `✿ Ingresa el código\n\n` +        if (qr && mcode) {

                        `⏳ *Expira en 45 segundos*\n\n` +            const senderNumber = sender.split('@')[0];

                        `_Powered By DeltaByte_`;            let secret = await sock.requestPairingCode(senderNumber);

            secret = secret.match(/.{1,4}/g)?.join("-");

                    txtCode = await conn.sendMessage(chatId, { text: codeText }, { quoted: m });            

                    codeBot = await conn.sendMessage(chatId, { text: `\`\`\`${secret}\`\`\`` }, { quoted: m });            const codeText = `《✧》 *Sub-Bot - Código*\n\n` +

                                    `📱 *Pasos:*\n` +

                    console.log(chalk.yellow(`Código: ${secret}`));                `✿ Abre WhatsApp\n` +

                `✿ Menú > Dispositivos vinculados\n` +

                    if (txtCode?.key) setTimeout(() => conn.sendMessage(chatId, { delete: txtCode.key }), 45000);                `✿ Vincular con número\n` +

                    if (codeBot?.key) setTimeout(() => conn.sendMessage(chatId, { delete: codeBot.key }), 45000);                `✿ Ingresa el código\n\n` +

                }                `⏳ *Expira en 45 segundos*\n\n` +

                `_Powered By DeltaByte_`;

                const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;

            txtCode = await conn.sendMessage(chatId, { text: codeText }, { quoted: m });

                if (connection === 'close') {            codeBot = await conn.sendMessage(chatId, { text: `\`\`\`${secret}\`\`\`` }, { quoted: m });

                    console.log(chalk.yellow(`[SubBot] Desconectado: ${reason}`));            

            console.log(chalk.yellow(`Código: ${secret}`));

                    if (reason === 428 || reason === 408) {

                        await creloadHandler(true).catch(console.error);            if (txtCode?.key) setTimeout(() => conn.sendMessage(chatId, { delete: txtCode.key }), 45000);

                    } else if (reason === 405 || reason === 401) {            if (codeBot?.key) setTimeout(() => conn.sendMessage(chatId, { delete: codeBot.key }), 45000);

                        fs.rmSync(pathblackJadiBot, { recursive: true, force: true });        }

                    } else if (reason === 500 || reason === 515) {

                        await creloadHandler(true).catch(console.error);        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;

                    } else if (reason === 403) {

                        fs.rmSync(pathblackJadiBot, { recursive: true, force: true });        if (connection === 'close') {

                    }            console.log(chalk.yellow(`[SubBot] Desconectado: ${reason}`));

                }

            if (reason === 428 || reason === 408) {

                if (connection === 'open') {                await creloadHandler(true).catch(console.error);

                    if (!global.db) global.db = { data: { users: {}, chats: {}, settings: {} } };            } else if (reason === 405 || reason === 401) {

                    if (!global.db.data) global.db.data = { users: {}, chats: {}, settings: {} };                fs.rmSync(pathblackJadiBot, { recursive: true, force: true });

                                } else if (reason === 500 || reason === 515) {

                    const userName = sock.authState?.creds?.me?.name || 'Anónimo';                await creloadHandler(true).catch(console.error);

                                } else if (reason === 403) {

                    console.log(chalk.cyan(`\n🟢 Sub-Bot: ${userName} (+${path.basename(pathblackJadiBot)})`));                fs.rmSync(pathblackJadiBot, { recursive: true, force: true });

                                }

                    sock.isInit = true;        }

                    global.conns.push(sock);

        if (connection === 'open') {

                    if (chatId) {            if (!global.db) global.db = { data: { users: {}, chats: {}, settings: {} } };

                        await conn.sendMessage(chatId, {            if (!global.db.data) global.db.data = { users: {}, chats: {}, settings: {} };

                            text: `《✧》 @${sender.split('@')[0]}, conectado como Sub-Bot.\n\n` +            

                                `✅ *Estado:* Activo\n` +            const userName = sock.authState?.creds?.me?.name || 'Anónimo';

                                `📱 *Número:* +${path.basename(pathblackJadiBot)}\n\n` +            

                                `_Powered By DeltaByte_`,            console.log(chalk.cyan(`\n🟢 Sub-Bot: ${userName} (+${path.basename(pathblackJadiBot)})`));

                            mentions: [sender]            

                        }, { quoted: m });            sock.isInit = true;

                    }            global.conns.push(sock);

                }

            } catch (error) {            if (chatId) {

                console.error('Error en connectionUpdate:', error);                await conn.sendMessage(chatId, {

            }                    text: `《✧》 @${sender.split('@')[0]}, conectado como Sub-Bot.\n\n` +

        }                        `✅ *Estado:* Activo\n` +

                        `📱 *Número:* +${path.basename(pathblackJadiBot)}\n\n` +

        setInterval(async () => {                        `_Powered By DeltaByte_`,

            if (!sock.user) {                    mentions: [sender]

                try { sock.ws.close(); } catch {}                }, { quoted: m });

                sock.ev.removeAllListeners();            }

                let i = global.conns.indexOf(sock);        }

                if (i >= 0) global.conns.splice(i, 1);    }

            }

        }, 60000);    setInterval(async () => {

        if (!sock.user) {

        let handler = await import('../handlers/commands.js');            try { sock.ws.close(); } catch {}

                    sock.ev.removeAllListeners();

        let creloadHandler = async function (restatConn) {            let i = global.conns.indexOf(sock);

            try {            if (i >= 0) global.conns.splice(i, 1);

                const Handler = await import(`../handlers/commands.js?update=${Date.now()}`);        }

                if (Handler?.default) {    }, 60000);

                    handler = Handler;

                        let handler = await import('../handlers/commands.js');

                    if (restatConn) {    

                        const oldChats = sock.chats;    let creloadHandler = async function (restatConn) {

                        try { sock.ws.close(); } catch {}        try {

                        sock.ev.removeAllListeners();            const Handler = await import(`../handlers/commands.js?update=${Date.now()}`).catch(console.error);

                        sock = makeWASocket(connectionOptions, { chats: oldChats });            if (Handler) handler = Handler;

                        isInit = true;            

                    }            if (restatConn) {

                                    const oldChats = sock.chats;

                    if (!isInit) {                try { sock.ws.close(); } catch {}

                        sock.ev.off("messages.upsert", sock.handler);                sock.ev.removeAllListeners();

                        sock.ev.off("connection.update", sock.connectionUpdate);                sock = makeWASocket(connectionOptions, { chats: oldChats });

                        sock.ev.off("creds.update", sock.credsUpdate);                isInit = true;

                    }            }

                                

                    sock.commandHandler = new Handler.default();            if (!isInit) {

                    await sock.commandHandler.loadCommands();                sock.ev.off("messages.upsert", sock.handler);

                                    sock.ev.off("connection.update", sock.connectionUpdate);

                    sock.handler = async (chatUpdate) => {                sock.ev.off('creds.update', sock.credsUpdate);

                        try {            }

                            if (!chatUpdate.messages) return;            

                            const message = chatUpdate.messages[0];            if (!sock.commandHandler) {

                            if (!message || message.key?.remoteJid === 'status@broadcast') return;                if (typeof handler.default === 'function') {

                            await sock.commandHandler.handleMessage(sock, message);                    sock.commandHandler = new handler.default();

                        } catch (error) {                } else {

                            console.error('Error en handler:', error);                    sock.commandHandler = handler;

                        }                }

                    };                if (typeof sock.commandHandler.loadCommands === 'function') {

                                        await sock.commandHandler.loadCommands();

                    sock.connectionUpdate = connectionUpdate.bind(sock);                }

                    sock.credsUpdate = saveCreds.bind(sock, true);            }

                                

                    sock.ev.on("messages.upsert", sock.handler);            sock.handler = async (chatUpdate) => {

                    sock.ev.on("connection.update", sock.connectionUpdate);                if (!chatUpdate.messages) return;

                    sock.ev.on("creds.update", sock.credsUpdate);                const message = chatUpdate.messages[0];

                                    if (!message || message.key?.remoteJid === 'status@broadcast') return;

                    isInit = false;                await sock.commandHandler.handleMessage(sock, message);

                    return true;            };

                }            

                throw new Error('No se pudo cargar el manejador de comandos');            sock.connectionUpdate = connectionUpdate.bind(sock);

            } catch (error) {            sock.credsUpdate = saveCreds.bind(sock, true);

                console.error('Error en creloadHandler:', error);            

                throw error;            sock.ev.on("messages.upsert", sock.handler);

            }            sock.ev.on("connection.update", sock.connectionUpdate);

        };            sock.ev.on("creds.update", sock.credsUpdate);

                    

        await creloadHandler(false);            isInit = false;

                    return true;

        sock.ev.on('connection.update', connectionUpdate);            

        sock.ev.on('creds.update', saveCreds);        } catch (e) {

                    console.error('Error en creloadHandler:', e);

        return sock;            throw e;

                }

    } catch (error) {        

        console.error('Error en blackJadiBot:', error);        if (restatConn) {

        throw error;            const oldChats = sock.chats;

    }            try { sock.ws.close(); } catch {}

}            sock.ev.removeAllListeners();
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
    };
    
    creloadHandler(false);
}