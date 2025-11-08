import { config } from '../config/bot.js';
import os from 'os';

export default {
    name: 'botinfo',
    aliases: ['info', 'bot', 'status'],
    category: 'info',
    description: 'Información del bot con opciones interactivas',
    usage: '#botinfo',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            const memoryUsage = process.memoryUsage();
            const totalMem = os.totalmem() / 1024 / 1024 / 1024;
            const freeMem = os.freemem() / 1024 / 1024 / 1024;
            const usedMem = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);

            const buttons = [
                { 
                    buttonId: 'ping_bot', 
                    buttonText: { displayText: '⚡ Ping' }, 
                    type: 1 
                },
                { 
                    buttonId: 'menu_principal', 
                    buttonText: { displayText: '📋 Menú' }, 
                    type: 1 
                },
                { 
                    buttonId: 'support_group', 
                    buttonText: { displayText: '💬 Soporte' }, 
                    type: 1 
                }
            ];

            const buttonMessage = {
                text: `╭━━━━━━━━━━━━━━━━━╮
│   🤖 *BOT INFORMATION*
╰━━━━━━━━━━━━━━━━━╯

📱 *Nombre:* ${config.botName}
📦 *Versión:* 1.0.6
👨‍💻 *Creador:* DeltaByte
🔧 *Plataforma:* Node.js ${process.version}

━━━━━━━━━━━━━━━━━━

⏱️ *Tiempo activo:*
${days}d ${hours}h ${minutes}m ${seconds}s

💾 *Memoria:*
• Uso: ${usedMem} MB
• Total Sistema: ${totalMem.toFixed(2)} GB
• Libre: ${freeMem.toFixed(2)} GB

🖥️ *Sistema:*
• OS: ${os.type()} ${os.release()}
• CPU: ${os.cpus()[0].model}
• Núcleos: ${os.cpus().length}

━━━━━━━━━━━━━━━━━━

✨ *Características:*
• 140+ Comandos
• IA Gemini 2.0
• Anti-NSFW
• Multi-idioma
• Auto-respuestas

🔗 *Enlaces:*
• Canal: ${config.links.channel}
• Comandos: ${config.links.commands}

━━━━━━━━━━━━━━━━━━
_Innovación sin límites 🚀_`,
                footer: 'Nishikigi Chisato Bot',
                buttons: buttons,
                headerType: 1
            };

            await sock.sendMessage(chatId, buttonMessage);

        } catch (error) {
            console.error('Error en botinfo:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al obtener información del bot.'
            });
        }
    }
};
