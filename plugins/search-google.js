import axios from 'axios'
import * as cheerio from 'cheerio'

const googleCommand = {
    name: 'google',
    aliases: ['ggl', 'search', 'buscar'],
    category: 'utils',
    description: 'Busca información en Google',
    usage: '#google [texto a buscar]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #google clima hoy\n` +
                        `✿ #ggl recetas de pizza\n` +
                        `✿ #google inteligencia artificial`
                });
                return
            }
            
            const query = args.join(' ')
            
            await sock.sendMessage(chatId, {
                text: `《✧》 Buscando en Google: "${query}"...`
            })

            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es`
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000
            })

            const $ = cheerio.load(response.data)
            const results = []
            
            $('div.g').each((i, elem) => {
                if (i >= 5) return false
                
                const title = $(elem).find('h3').first().text()
                const url = $(elem).find('a').first().attr('href')
                const description = $(elem).find('.VwiC3b, .yXK7lf, .lyLwlc').first().text()
                
                if (title && url) {
                    results.push({
                        title: title.trim(),
                        url: url.startsWith('http') ? url : `https://www.google.com${url}`,
                        description: description.trim()
                    })
                }
            })

            if (results.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `《✧》 No se encontraron resultados para: "${query}"\n\n💡 *Tip:* Intenta con otras palabras clave.`
                })
                return
            }

            let responseText = `《✧》 *Resultados de Google*\n\n`
            responseText += `🔍 Búsqueda: *${query}*\n`
            responseText += `📊 Resultados encontrados: ${results.length}\n\n`
            responseText += `─────────────────\n\n`

            results.forEach((result, index) => {
                responseText += `${index + 1}. *${result.title}*\n`
                
                if (result.description) {
                    const shortDesc = result.description.length > 150
                        ? result.description.substring(0, 150) + '...'
                        : result.description;
                    responseText += `   ${shortDesc}\n`
                }
                
                responseText += `   🔗 ${result.url}\n\n`
            })

            responseText += `─────────────────\n`
            responseText += `_Resultados obtenidos de Google_`
            
            await sock.sendMessage(chatId, {
                text: responseText
            }, { quoted: msg })
            
        } catch (error) {
            console.error('Error en comando google:', error);
            
            let errorMessage = '《✧》 Error al realizar la búsqueda en Google.'
            
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La búsqueda tardó demasiado. Intenta de nuevo.'
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMessage = '《✧》 Error de conexión. Verifica tu internet.'
            } else if (error.response?.status === 429) {
                errorMessage = '《✧》 Demasiadas búsquedas. Espera un momento.'
            } else if (error.response?.status === 403) {
                errorMessage = '《✧》 Google bloqueó la solicitud. Intenta más tarde.'
            }
            
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Intenta con palabras clave más específicas.`
            })
        }
    }
}

export default googleCommand