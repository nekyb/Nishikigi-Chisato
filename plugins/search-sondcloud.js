import axios from 'axios'
import * as cheerio from 'cheerio'

const scsearchCommand = {
    name: 'scsearch',
    aliases: ['sc', 'soundcloud'],
    category: 'search',
    description: 'Busca canciones en SoundCloud y devuelve los primeros resultados.',
    usage: '#scsearch [título de la canción]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Uso incorrecto del comando*\n\n' +
                        'Ejemplo:\n' +
                        '✿ #scsearch lo-fi hip hop'
                })
            }

            const query = args.join(' ');
            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando en SoundCloud...'
            });

            const searchUrl = `https://soundcloud.com/search/sounds?q=${encodeURIComponent(query)}`
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })

            const $ = cheerio.load(data)
            const tracks = []
            $('.soundList__item').slice(0, 5).each((i, el) => {
                const title = $(el).find('.soundTitle__title').attr('title')
                const artist = $(el).find('.soundTitle__username').text()
                const link = 'https://soundcloud.com' + $(el).find('.soundTitle__title').attr('href')
                if (title && link) {
                    tracks.push({ title, artist, link })
                }
            })

            if (tracks.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No encontré canciones en SoundCloud para tu búsqueda.'
                })
            }

            let responseText = `╔═══《 SOUNDCLOUD SEARCH - ${query.toUpperCase()} 》═══╗\n`   
            tracks.forEach((track, i) => {
                responseText += `║\n`;
                responseText += `║ *${i + 1}. Título:* ${track.title}\n`;
                responseText += `║   *Artista:* ${track.artist}\n`;
                responseText += `║   *Link:* ${track.link}\n`;
            })
            responseText += `║\n╚══════════════════════════════════╝`
            await sock.sendMessage(chatId, {
                text: responseText
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en comando scsearch:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al realizar la búsqueda en SoundCloud.'
            })
        }
    }
}

export default scsearchCommand