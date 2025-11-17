import axios from 'axios';

export default {
    name: 'twitter',
    aliases: ['tw', 'x', 'twdl', 'xdl'],
    category: 'downloads',
    description: 'Descarga videos e imágenes de Twitter/X',
    usage: '#twitter [url]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Twitter/X Downloader*\n\n` +
                        `Uso:\n` +
                        `✿ #twitter [url de Twitter/X]\n` +
                        `✿ #x [url de Twitter/X]\n\n` +
                        `Ejemplo:\n` +
                        `#twitter https://twitter.com/user/status/123456`
                });
            }

            const url = args[0];
            if (!url.includes('twitter.com') && !url.includes('x.com')) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ Por favor ingresa un enlace válido de Twitter/X'
                });
            }

            try {
                const apiUrl = `https://api.vxtwitter.com/Twitter/status/${url.split('/status/')[1]?.split('?')[0]}`;
                const response = await axios.get(apiUrl);
                if (response.data && response.data.media_extended) {
                    const media = response.data.media_extended[0];
                    if (media.type === 'video') {
                        const videoUrl = media.url;
                        await sock.sendMessage(chatId, {
                            video: { url: videoUrl },
                            caption: `《✧》 *Twitter/X Video*\n\n` +
                                `✦ ${response.data.text || 'Sin descripción'}\n` +
                                `✦ @${response.data.user_screen_name}\n` +
                                `✦ ${url}`
                        }, { quoted: msg })
                    } else if (media.type === 'image') {
                        await sock.sendMessage(chatId, {
                            image: { url: media.url },
                            caption: `《✧》 *Twitter/X Imagen*\n\n` +
                                `✦ ${response.data.text || 'Sin descripción'}\n` +
                                `✦ @${response.data.user_screen_name}`
                        }, { quoted: msg });
                    }
                } else {
                    throw new Error('No se encontró contenido multimedia');
                }

            } catch (apiError) {
                await sock.sendMessage(chatId, {
                    text: `《✿》 ⚠️ *Descarga alternativa*\n\n` +
                        `No se pudo descargar directamente.\n` +
                        `Intenta con otro enlace o verifica que el tweet sea público.`
                });
            }

        } catch (error) {
            console.error('Error en comando twitter:', error);
            await sock.sendMessage(chatId, {
                text: '《✿》 ❌ Error al descargar contenido de Twitter/X.\n\n' +
                    'Verifica que el enlace sea válido y el tweet sea público.'
            });
        }
    }
};
