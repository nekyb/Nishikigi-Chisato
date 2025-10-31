import axios from 'axios'

const tiktokCommand = {
    name: 'tiktok',
    aliases: ['ttk', 'tt'],
    category: 'downloads',
    description: 'Busca y descarga videos de TikTok',
    usage: '#tiktok [texto de búsqueda o URL]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const API_URL = 'https://api.betabotz.org/api/download/tiktok'
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #tiktok https://www.tiktok.com/@user/video/xxx\n` +
                        `✿ #ttk gatos graciosos\n` +
                        `✿ #tiktok baile viral`
                })
            }

            const query = args.join(' ')
            const tiktokUrlRegex = /^https?:\/\/(www\.)?(vm\.)?tiktok\.com\/.+$/
            const isUrl = tiktokUrlRegex.test(query)
            if (!isUrl) { return await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor, proporciona una URL de TikTok válida.'
                }, { quoted: msg })
            } await sock.sendMessage(chatId, {
                text: '《✧》 Descargando video de TikTok...'
            })

            const response = await axios.get(`${API_URL}?url=${encodeURIComponent(query)}&apikey=beta-key`)
            const data = response.data
            if (!data || data.status !== 'success' || !data.result) {
                throw new Error('No se pudo obtener el video desde la API.')
            }

            const video = data.result
            const videoUrl = video.video.noWatermark
            if (!videoUrl) {
                return await sock.sendMessage(chatId, { text: '《✧》 No se encontró un video sin marca de agua.' }, { quoted: msg })
            }

            const caption = `《✧》 *TikTok Download*\n\n` +
                `✿ *Título:* ${video.title || 'Sin título'}\n` +
                `✿ *Autor:* @${video.author.nickname || 'Desconocido'}\n\n` +
                `_Powered By DeltaByte_`
            await sock.sendMessage(chatId, {
                video: { url: videoUrl },
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en comando tiktok:', error);
            let errorMessage = '《✧》 Error al procesar la solicitud de TikTok.';
            if (error.message?.includes('Video does not exist')) {
                errorMessage = '《✧》 El video no existe o fue eliminado.';
            }
            else if (error.message?.includes('rate limit')) {
                errorMessage = '《✧》 Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
            }
            else if (error.message?.includes('private')) {
                errorMessage = '《✧》 Este video es privado y no se puede descargar.';
            }
            else if (error.message?.includes('network') || error.message?.includes('timeout')) {
                errorMessage = '《✧》 Error de conexión. Intenta de nuevo.';
            }
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Asegúrate de que el video sea público.`
            });
        }
    }
};
export default tiktokCommand;