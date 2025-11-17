import yts from 'yt-search'

const playCommand = {
    name: 'play',
    aliases: ['playvid', 'play2'],
    category: 'descargas',
    description: 'Busca y descarga música o videos de YouTube',
    usage: '#play <nombre del video>',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const text = args.join(' ')
        if (!text) {
            return sock.sendMessage(chatId, {
                text: '❗ Ingresa un texto para buscar.\n\n*Ejemplo:* #play Despacito'
            }, { quoted: msg })
        }

        try {
            const search = await yts(text)
            const videoInfo = search.videos?.[0]
            if (!videoInfo) {
                return sock.sendMessage(chatId, { text: '❗ No se encontraron resultados.' }, { quoted: msg })
            }

            const body = `📹 *RESULTADO DE BÚSQUEDA*\n\n🎵 *${videoInfo.title}*\n👤 ${videoInfo.author.name}\n⏱️ ${videoInfo.timestamp}\n👁️ ${videoInfo.views.toLocaleString()} vistas\n\nElige una opción para descargar:`

            await sock.sendMessage(chatId, {
                image: { url: videoInfo.thumbnail },
                caption: body,
                footer: '🤖 Bot de Descargas',
                buttons: [
                    { buttonId: `#ytmp3 ${videoInfo.url}`, buttonText: { displayText: '🎧 Audio' }, type: 1 },
                    { buttonId: `#ytmp4 ${videoInfo.url}`, buttonText: { displayText: '📽️ Video' }, type: 1 },
                    { buttonId: `#ytmp3doc ${videoInfo.url}`, buttonText: { displayText: '💿 Audio Doc' }, type: 1 },
                    { buttonId: `#ytmp4doc ${videoInfo.url}`, buttonText: { displayText: '🎥 Video Doc' }, type: 1 }
                ],
                headerType: 4,
                viewOnce: true,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false,
                        title: '📡 Descargas YouTube',
                        body: videoInfo.author.name,
                        thumbnailUrl: videoInfo.thumbnail,
                        sourceUrl: videoInfo.url
                    }
                }
            }, { quoted: msg })

        } catch (e) {
            console.error(e)
            sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: msg })
        }
    }
}

export default playCommand
