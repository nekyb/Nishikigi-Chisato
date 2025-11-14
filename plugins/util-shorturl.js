import axios from 'axios';

export default {
    name: 'shorturl',
    aliases: ['acortar', 'tinyurl', 'short'],
    category: 'utils',
    description: 'Acorta URLs largas para compartir fácilmente',
    usage: '#shorturl [URL]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Acortador de URLs*\n\n` +
                        `Uso: #shorturl [URL]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #shorturl https://www.google.com/search?q=very+long+url\n` +
                        `✿ #short https://example.com/path/to/resource`
                });
            }

            const url = args[0];
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ Por favor ingresa una URL válida (debe comenzar con http:// o https://)'
                });
            }


            try {
                const response = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
                const shortUrl = response.data;
                await sock.sendMessage(chatId, {
                    text: `《✧》 *URL Acortada*\n\n` +
                        `🔗 *Original:*\n${url}\n\n` +
                        `✨ *Acortada:*\n${shortUrl}\n\n` +
                        `💡 Usa la URL corta para compartir fácilmente`
                }, { quoted: msg });

            } catch (apiError) {
                const response2 = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
                const shortUrl = response2.data;

                await sock.sendMessage(chatId, {
                    text: `《✧》 *URL Acortada*\n\n` +
                        `🔗 *Original:*\n${url}\n\n` +
                        `✨ *Acortada:*\n${shortUrl}`
                }, { quoted: msg });
            }
        } catch (error) {
            console.error('Error en shorturl:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al acortar URL.\n\n` +
                    `Verifica que la URL sea válida y accesible.`
            });
        }
    }
};
