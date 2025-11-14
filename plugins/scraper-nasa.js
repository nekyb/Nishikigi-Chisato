import axios from 'axios';

export default {
    name: 'nasa',
    aliases: ['apod', 'espacio', 'space'],
    category: 'scraper',
    description: 'Obtiene la imagen astronómica del día de NASA',
    usage: '#nasa [fecha YYYY-MM-DD]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            let url = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
            if (args.length > 0) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(args[0])) {
                    return await sock.sendMessage(chatId, {
                        text: '《✧》 ❌ Formato de fecha incorrecto.\n\n' +
                            'Usa: YYYY-MM-DD\nEjemplo: #nasa 2024-01-15'
                    });
                }
                url += `&date=${args[0]}`;
            }

            const response = await axios.get(url);
            const data = response.data;
            let mediaMessage;
            if (data.media_type === 'image') {
                mediaMessage = {
                    image: { url: data.hdurl || data.url },
                    caption: `《✧》 *NASA - Imagen del Día* 🌌\n\n` +
                        `✦ *Fecha:* ${data.date}\n` +
                        `✦ *Título:* ${data.title}\n\n` +
                        `✦ *Descripción:*\n${data.explanation}\n\n` +
                        `${data.copyright ? `✦ *Copyright:* ${data.copyright}\n` : ''}` +
                        `\n_Datos de NASA API_`
                };
            } else if (data.media_type === 'video') {
                mediaMessage = {
                    text: `《✧》 *NASA - Video del Día* 🎥\n\n` +
                        `✦ *Fecha:* ${data.date}\n` +
                        `✦ *Título:* ${data.title}\n\n` +
                        `✦ *Descripción:*\n${data.explanation}\n\n` +
                        `✦ *Link:* ${data.url}\n\n` +
                        `${data.copyright ? `✦ *Copyright:* ${data.copyright}\n` : ''}` +
                        `\n_Datos de NASA API_`
                };
            }

            await sock.sendMessage(chatId, mediaMessage, { quoted: msg });

        } catch (error) {
            console.error('Error en nasa:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Error al obtener datos de NASA.\n\n' +
                    'Verifica que la fecha sea válida (no puede ser futura).'
            });
        }
    }
};
