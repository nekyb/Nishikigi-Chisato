import { config } from '../config/bot.js';

export default {
    name: 'menu',
    aliases: ['help', 'comandos', 'ayuda'],
    category: 'info',
    description: 'Muestra el menú principal con botones interactivos',
    usage: '#menu',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const buttons = [
                { 
                    buttonId: 'menu_downloads', 
                    buttonText: { displayText: '📥 Descargas' }, 
                    type: 1 
                },
                { 
                    buttonId: 'menu_innovation', 
                    buttonText: { displayText: '🤖 IA e Innovación' }, 
                    type: 1 
                },
                { 
                    buttonId: 'menu_games', 
                    buttonText: { displayText: '🎮 Juegos' }, 
                    type: 1 
                },
                { 
                    buttonId: 'menu_utils', 
                    buttonText: { displayText: '🛠️ Utilidades' }, 
                    type: 1 
                },
                { 
                    buttonId: 'menu_admin', 
                    buttonText: { displayText: '👑 Admin' }, 
                    type: 1 
                }
            ];

            const buttonMessage = {
                image: { url: config.images.help },
                caption: `╭━━━━━━━━━━━━━━━━━╮
│ 《✧》 *${config.botName}* 《✧》
╰━━━━━━━━━━━━━━━━━╯

¡Hola! 👋 Soy un bot multifuncional con más de 140+ comandos.

🌟 *Categorías Principales:*
━━━━━━━━━━━━━━━━━━

📥 *Descargas*
   • TikTok, Instagram, YouTube
   • Twitter, Pinterest, Spotify
   • Facebook, Mediafire

🤖 *IA e Innovación*
   • Chat con Gemini 2.0
   • Análisis de imágenes
   • Generador de código
   • Traductor avanzado
   • Text-to-Speech

🎮 *Juegos*
   • Trivia, Matemáticas
   • TicTacToe, PPT
   • Sistema de economía
   • Gacha de waifus

🛠️ *Utilidades*
   • Stickers, QR codes
   • Calculadora científica
   • Acortador de URLs
   • Convertidores

👑 *Administración*
   • Gestión de grupos
   • Anti-NSFW con IA
   • Sistema de bans
   • Bienvenidas

━━━━━━━━━━━━━━━━━━
💡 Usa los botones de abajo para ver comandos por categoría

✨ Prefijo: ${config.prefix}
👨‍💻 By: DeltaByte`,
                footer: 'Nishikigi Chisato Bot - Innovación sin límites',
                buttons: buttons,
                headerType: 4
            };

            await sock.sendMessage(chatId, buttonMessage);

        } catch (error) {
            console.error('Error en menu:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 *${config.botName}*\n\n` +
                    `Usa ${config.prefix}help para ver todos los comandos disponibles.`
            });
        }
    }
};
