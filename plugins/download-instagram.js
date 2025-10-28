import { igdl } from 'ruhend-scraper';
const instagramCommand = {
    name: 'instagram',
    aliases: ['ig', 'igdl'],
    category: 'downloads',
    description: 'Descarga videos e imágenes de Instagram',
    usage: '#instagram [url de Instagram]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #instagram https://www.instagram.com/p/xxxxx\n` +
                        `✿ #ig https://www.instagram.com/reel/xxxxx`
                });
            }
            const url = args[0];
            if (!url.includes('instagram.com')) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor ingresa un link válido de Instagram.'
                });
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 Descargando contenido de Instagram...'
            });
            const response = await igdl(url);
            const data = response.data;
            if (!data || data.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se encontró contenido en este enlace.\n\n' +
                        '💡 *Tip:* Verifica que el enlace sea correcto y público.'
                });
            }
            const media = data.sort((a, b) => {
                const resA = parseInt(a.resolution || '0');
                const resB = parseInt(b.resolution || '0');
                return resB - resA;
            })[0];
            if (!media || !media.url) {
                throw new Error('No se encontró un medio válido.');
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 Enviando contenido...'
            });
            await sock.sendMessage(chatId, {
                video: { url: media.url },
                caption: `《✧》 *Instagram Downloader*\n\n` +
                    `✿ *Resolución:* ${media.resolution || 'Desconocida'}\n` +
                    `✿ *Link original:* ${url}`
            }, { quoted: msg });
            await sock.sendMessage(chatId, {
                text: `《✧》 ✅ *Descarga completada*`
            });
        }
        catch (error) {
            console.error('Error en comando instagram:', error);
            let errorMessage = '《✧》 Error al descargar contenido de Instagram.';
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La descarga tardó demasiado. Intenta de nuevo.';
            }
            else if (error.response?.status === 404) {
                errorMessage = '《✧》 El contenido no fue encontrado o es privado.';
            }
            else if (error.response?.status === 400) {
                errorMessage = '《✧》 URL inválida. Verifica el enlace.';
            }
            else if (!error.response) {
                errorMessage = '《✧》 No se pudo conectar con el servicio de descarga.';
            }
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Asegúrate de que la publicación sea pública y el enlace esté correcto.`
            });
        }
    }
};
export default instagramCommand;