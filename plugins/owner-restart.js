import { config } from '../config/bot.js';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export default {
    name: 'restart',
    description: 'Reinicia el bot completamente',
    usage: '#restart',
    tags: ['owner'],
    ownerOnly: true,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            await sock.sendMessage(chatId, {
                text: '🔄 Reiniciando el bot...\nEspera unos segundos.'
            }, { quoted: msg });
            const pm2Command = process.env.PM2 ? 'pm2 restart all' : 'node index.js';
            if (process.env.PM2) {
                await execAsync(pm2Command);
            } else {
                process.exit(1); 
            }
        } catch (error) {
            console.error('Error al reiniciar:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Error al reiniciar el bot.\n\n' + error.message
            }, { quoted: msg });
        }
    }
};