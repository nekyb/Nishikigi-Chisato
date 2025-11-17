
import chalk from 'chalk';
import path from 'path';

const listbotsCommand = {
    name: 'listbots',
    aliases: ['bots', 'subbots', 'listsubbots'],
    category: 'serbot',
    description: 'Lista todos los sub-bots activos',
    usage: '#listbots',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        try {
            const chatId = msg.key?.remoteJid;
            if (!global.conns || global.conns.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Sub-Bots Activos*\n\n` +
                        `❌ No hay sub-bots activos en este momento.\n\n` +
                        `💡 Usa #serbot para crear uno.`
                }, { quoted: msg });
            }
            
            let botsList = `《✿》 *Sub-Bots Activos* (${global.conns.length})\n\n`;
            global.conns.forEach((bot, index) => {
                const userName = bot.user?.name || 'Anónimo';
                const userPhone = bot.user?.id?.split(':')[0] || 'Desconocido';
                const status = bot.user ? '🟢 Online' : '🔴 Offline';
                
                botsList += `${index + 1}. ${status}\n`;
                botsList += `   👤 ${userName}\n`;
                botsList += `   📱 +${userPhone}\n\n`;
            });
            
            botsList += `> _*Powered By DeltaByte*_`;
            await sock.sendMessage(chatId, {
                text: botsList
            }, { quoted: msg });
            
        } catch (error) {
            console.error('[LISTBOTS] Error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `《✧》 *Error*\n\n❌ ${error.message}`
            }, { quoted: msg });
        }
    }
};

export default listbotsCommand;
