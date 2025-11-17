import fetch from 'node-fetch'

const spotifyCommand = {
    name: 'spotify',
    aliases: ['sp', 'spotifydl'],
    category: 'downloads',
    description: 'Busca y descarga canciones de Spotify',
    usage: '#spotify [nombre de la canción]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        
        try {
            if (args.length === 0) {
                const ejemplos = [
                    'Adele Hello',
                    'Sia Unstoppable',
                    'Maroon 5 Memories',
                    'Karol G Provenza',
                    'Natalia Jiménez Creo en mí'
                ]
                const random = ejemplos[Math.floor(Math.random() * ejemplos.length)]
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #spotify ${random}`
                })
            }

            // Enviar reacción de espera
            await sock.sendMessage(chatId, { 
                react: { text: '⏱', key: msg.key } 
            })

            const query = encodeURIComponent(args.join(' '))
            const searchUrl = `https://api.delirius.store/search/spotify?q=${query}`

            // Buscar la canción
            const res = await fetch(searchUrl)
            const json = await res.json()

            if (!json.status || !json.data || json.data.length === 0) {
                await sock.sendMessage(chatId, { 
                    react: { text: '❌', key: msg.key } 
                })
                return await sock.sendMessage(chatId, {
                    text: '❌ No encontré la canción que estás buscando.\n\n' +
                        '💡 *Tip:* Intenta con el nombre del artista y la canción.'
                })
            }

            const track = json.data[0]
            if (!track || !track.url) {
                await sock.sendMessage(chatId, { 
                    react: { text: '⚠️', key: msg.key } 
                })
                return await sock.sendMessage(chatId, {
                    text: '⚠️ Resultado inválido de la búsqueda.'
                })
            }

            // Descargar el audio
            const downloadUrl = `https://api.delirius.store/download/spotifydl?url=${encodeURIComponent(track.url)}`
            const dlRes = await fetch(downloadUrl).then(r => r.json()).catch(() => null)
            const audioUrl = dlRes?.data?.url

            if (!audioUrl || audioUrl.includes('undefined')) {
                await sock.sendMessage(chatId, { 
                    react: { text: '⚠️', key: msg.key } 
                })
                return await sock.sendMessage(chatId, {
                    text: '⚠️ Error al obtener el enlace de descarga.\n\n' +
                        '💡 *Tip:* Intenta con otra canción o espera unos momentos.'
                })
            }

            // Formatear el caption
            const caption = `╔═══『 SPOTIFY 🎶 』
║ ✦  Título: ${track.title}
║ ✦  Artista: ${track.artist}
║ ✦  Álbum: ${track.album}
║ ✦  Duración: ${track.duration}
║ ✦  Popularidad: ${track.popularity}
║ ✦  Publicado: ${track.publish}
║ ✦  Link: ${track.url}
╚═════════════════╝`

            // Enviar imagen con información
            await sock.sendMessage(chatId, {
                image: { url: track.image },
                caption: caption
            }, { quoted: msg })

            // Enviar audio
            await sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${track.title}.mp3`
            }, { quoted: msg })

            // Reacción de éxito
            await sock.sendMessage(chatId, { 
                react: { text: '✅', key: msg.key } 
            })

        } catch (error) {
            console.error('Error en comando spotify:', error)
            
            // Reacción de error
            await sock.sendMessage(chatId, { 
                react: { text: '⚠️', key: msg.key } 
            })

            let errorMessage = '⚠️ Ocurrió un error al buscar o descargar la canción.'
            
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✿》 La búsqueda tardó demasiado. Intenta de nuevo.'
            } else if (error.cause?.code === 'ENOTFOUND') {
                errorMessage = '《✿》 No se pudo conectar con el servicio de Spotify.'
            }

            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Intenta buscar con el nombre completo de la canción y el artista.`
            })
        }
    }
}

export default spotifyCommand