import axios from 'axios'
import yts from 'yt-search'

const ytmp4Command = {
    name: 'ytmp4',
    aliases: ['play2', 'video', 'ytvideo'],
    category: 'downloads',
    description: 'Descarga videos de YouTube por texto',
    usage: '#ytmp4 [nombre del video]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #ytmp4 Ozuna - Caramelo\n` +
                        `✿ #ytmp4 Música relajante`
                })
            }
            const searchQuery = args.join(' ')
            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando video en YouTube...'
            })
            const searchResults = await searchYouTube(searchQuery)
            if (!searchResults || searchResults.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se encontraron resultados para tu búsqueda.'
                })
            }
            const video = searchResults[0]
            const videoInfo = `🎬 *Título:* ${video.title}\n` +
                `⏱ *Duración:* ${video.timestamp}\n` +
                `📅 *Publicado:* ${video.ago}\n` +
                `📺 *Canal:* ${video.author.name || 'Desconocido'}\n` +
                `🔗 *URL:* ${video.url}\n\n` +
                `⏳ Descargando video...`;
            await sock.sendMessage(chatId, {
                image: { url: video.image },
                caption: videoInfo
            })
            try {
                const resolution = '360'
                const downloadUrl = `https://cloudkutube.eu/api/ytv?url=${encodeURIComponent(video.url)}&resolution=${resolution}`
                const response = await axios.get(downloadUrl, {
                    timeout: 60000
                });
                if (response.data.status !== 'success') {
                    throw new Error('Fallo al obtener el video desde la API')
                }
                const title = response.data.result.title
                const videoUrl = response.data.result.url
                await sock.sendMessage(chatId, {
                    video: { url: videoUrl },
                    mimetype: 'video/mp4',
                    caption: `《✧》 *🥮 Título:* ${title}\n\n_Descargado exitosamente_ ✅`,
                    fileName: `${title}.mp4`
                }, { quoted: msg })
            } catch (downloadError) {
                console.error('Error descargando video:', downloadError)
                let errorMsg = '《✧》 ❌ Lo siento, no pude descargar el video.'
                if (downloadError.code === 'ECONNABORTED' || downloadError.code === 'ETIMEDOUT') {
                    errorMsg = '《✧》 ⏱ El video tardó demasiado en descargarse. Intenta con un video más corto.'
                } else if (downloadError.response?.status === 404) {
                    errorMsg = '《✧》 ❌ El servicio de descarga no está disponible en este momento.'
                } await sock.sendMessage(chatId, {
                    text: `${errorMsg}\n\n💡 *Tip:* Puedes intentar con otro video o probar más tarde.`
                })
            }
        } catch (error) {
            console.error('Error en comando ytmp4:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Ocurrió un error inesperado al procesar tu solicitud.'
            })
        }
    }
}

async function searchYouTube(query) {
    try {
        const searchResult = await yts.search({
            query: query,
            hl: 'es',
            gl: 'ES'
        })

        return searchResult.videos.map((video) => ({
            title: video.title,
            timestamp: video.timestamp,
            ago: video.ago,
            author: {
                name: video.author?.name || 'Desconocido'
            },
            url: video.url,
            image: video.image || video.thumbnail,
            videoId: video.videoId
        }))
    } catch (error) {
        console.error('Error buscando en YouTube con yt-search:', error)
        throw error
    }
}

export default ytmp4Command