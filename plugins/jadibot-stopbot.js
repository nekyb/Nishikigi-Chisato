
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stopbotCommand = {
    name: 'stopbot',
    aliases: ['detenerbot', 'desconectar'],
    category: 'serbot',
    description: 'Detiene tu sub-bot activo',
    usage: '#stopbot',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        try {
            const chatId = msg.key?.remoteJid;
            let sender = msg.key?.participant || msg.key?.remoteJid;
            if (!sender) {
                sender = chatId?.endsWith('@g.us') ? null : chatId;
            }
            
            if (!sender) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error: No se pudo identificar al usuario.'
                }, { quoted: msg });
            }
            
            const userNumber = sender.split('@')[0];
            const subBotIndex = global.conns.findIndex(c => {
                const connNumber = c.user?.id?.split(':')[0] || path.basename(c.pathblackJadiBot || '');
                return connNumber === userNumber;
            });
            
            if (subBotIndex === -1) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *No Conectado*\n\n❌ No tienes ningún sub-bot activo.\n\n💡 Usa #serbot para crear uno.`
                }, { quoted: msg });
            }
            
            const subBot = global.conns[subBotIndex];
            try {
                await subBot.logout();
            } catch {
                try {
                    subBot.ws.close();
                } catch {}
            }
            
            subBot.ev.removeAllListeners();
            global.conns.splice(subBotIndex, 1);
            if (subBot.pathblackJadiBot && fs.existsSync(subBot.pathblackJadiBot)) {
                try {
                    fs.rmSync(subBot.pathblackJadiBot, { recursive: true, force: true });
                } catch (error) {
                    console.error('[STOPBOT] Error eliminando sesión:', error);
                }
            }
            
            console.log(chalk.red(`[STOPBOT] Sub-bot desconectado: +${userNumber}`));
            await sock.sendMessage(chatId, {
                text: `《✿》 *Sub-Bot Detenido*\n\n` +
                    `✦ Tu sub-bot fue desconectado exitosamente.\n` +
                    `✦ *Bots activos:* ${global.conns.length}\n\n` +
                    `✦ Usa #serbot para crear uno nuevo\n\n` +
                    `_Powered By DeltaByte_`,
                mentions: [sender]
            }, { quoted: msg });
        } catch (error) {
            console.error('[STOPBOT] Error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `《✿》 *Error*\n\n❌ ${error.message}`
            }, { quoted: msg });
        }
    }
};

export default stopbotCommand;
