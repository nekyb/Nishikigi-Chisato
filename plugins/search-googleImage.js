import axios from 'axios'
import * as cheerio from 'cheerio'

const gimgsearchCommand = {
    name: 'gimgsearch',
    aliases: ['gis', 'googleimg'],
    category: 'search',
    description: 'Busca imágenes en Google y devuelve enlaces directos (scraping).',
    usage: '#gimgsearch [término de búsqueda]',
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
                        '✿ #gimgsearch gatos graciosos'
                });
            }

            const query = args.join(' ')
            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando imágenes en Google...'
            });

            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })

            const $ = cheerio.load(data);
            const scriptContent = $('script').filter((i, el) => {
                return $(el).html().includes('AF_initDataCallback')
            }).html()
            if (!scriptContent) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo extraer la información de Google Images (estructura HTML cambiada).'
                })
            }

            const regex = /\[\"(https?:\/\/[^"]+)\",\d+,\d+\]/g
            let match
            const imageUrls = []
            while ((match = regex.exec(scriptContent)) !== null) {
                if (match[1].startsWith('http')) {
                    imageUrls.push(match[1])
                }
            }

            if (imageUrls.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No encontré resultados de imágenes para tu búsqueda.'
                })
            }

            const firstImageUrl = imageUrls[0]
            await sock.sendMessage(chatId, {
                image: { url: firstImageUrl },
                caption: `✅ Primera imagen encontrada para *${query}*.\n\nLink directo: ${firstImageUrl}`
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en comando gimgsearch:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al realizar la búsqueda de imágenes en Google.'
            })
        }
    }
}

export default gimgsearchCommand