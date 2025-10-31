import axios from 'axios'
import * as cheerio from 'cheerio'

const scraperCommand = {
    name: 'scraper',
    aliases: ['scrape', 'webinfo'],
    category: 'search',
    description: 'Realiza un scraping simple de una URL y devuelve el título y los primeros párrafos.',
    usage: '#scraper [URL]',
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
                        '✿ #scraper https://es.wikipedia.org/wiki/Scraping'
                })
            }

            const url = args[0]
            if (!url.startsWith('http')) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor, introduce una URL válida (ej. https://...).'
                })
            } await sock.sendMessage(chatId, {
                text: `《✧》 Scrapeando ${url}...`
            })

            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 15000
            })

            const $ = cheerio.load(data)
            const title = $('title').text() || 'Sin Título'
            let content = ''
            $('p').slice(0, 3).each((i, el) => {
                content += $(el).text().trim() + '\n\n'
            })

            if (content.length === 0) {
                content = 'No se pudo extraer el contenido principal (posiblemente la página es muy dinámica o está vacía).'
            } else {
                content = content.substring(0, 500) + '...' }

            const responseText = `╔═══《 WEB SCRAPER 》═══╗\n` +
                `║\n` +
                `║ ✦ *URL:* ${url}\n` +
                `║ ✦ *Título:* ${title}\n` +
                `║ ✦ *Contenido (Snippet):*\n` +
                `║   ${content}\n` +
                `║\n` +
                `╚═════════════════════╝`
            await sock.sendMessage(chatId, {
                text: responseText
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en comando scraper:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al realizar el scraping de la URL. Asegúrate de que la URL sea correcta y accesible.'
            })
        }
    }
}

export default scraperCommand