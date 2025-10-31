import axios from 'axios'
import * as cheerio from 'cheerio'

const bravesearchCommand = {
    name: 'bravesearch',
    aliases: ['brave', 'buscarb'],
    category: 'search',
    description: 'Busca un término en Brave Search y devuelve los primeros 5 resultados (scraping).',
    usage: '#bravesearch [término]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Uso incorrecto del comando*\n\n' +
                        'Ejemplo:\n' +
                        '✿ #bravesearch mejores navegadores web'
                })
            }

            const query = args.join(' ')
            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando en Brave Search...'
            })

            const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })

            const $ = cheerio.load(data)
            const results = []
            $('.snippet').slice(0, 5).each((i, el) => {
                const title = $(el).find('.snippet-title').text().trim()
                const link = $(el).find('.snippet-url').attr('href')
                const snippet = $(el).find('.snippet-description').text().trim()
                if (title && link) {
                    results.push({ title, link, snippet })
                }
            })

            if (results.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No encontré resultados de búsqueda para tu consulta en Brave Search.'
                })
            }

            let responseText = `╔═══《 BRAVE SEARCH - ${query.toUpperCase()} 》═══╗\n`
            results.forEach((result, i) => {
                responseText += `║\n`
                responseText += `║ *${i + 1}. Título:* ${result.title}\n`
                responseText += `║   *Snippet:* ${result.snippet.substring(0, 100)}...\n`
                responseText += `║   *Link:* ${result.link}\n`;
            })
            responseText += `║\n╚══════════════════════════════════╝`
            await sock.sendMessage(chatId, {
                text: '《✧》 Se encontraron resultados. Nota: El scraping de motores de búsqueda puede ser inestable.'
            }, { quoted: msg })
            await sock.sendMessage(chatId, {
                text: responseText
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en comando bravesearch:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al realizar la búsqueda en Brave Search.'
            })
        }
    }
}

export default bravesearchCommand