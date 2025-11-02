import axios from 'axios'
import * as cheerio from 'cheerio'

const xnxxCommand = {
    name: 'xnxx',
    aliases: ['xnxxs', 'xnxxsearch'],
    category: 'nsfw',
    description: 'Busca videos de XNXX (18+)',
    usage: '#xnxx [búsqueda]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗫𝗡𝗫𝗫 𝗦𝗘𝗔𝗥𝗖𝗛 ✦
━━━━━━━━━━━━━━━━━━━━━

⚠️ *Contenido +18*

📝 *Uso:*
• #xnxx [búsqueda]

📌 *Ejemplo:*
• #xnxx teen
• #xnxxs milf

━━━━━━━━━━━━━━━━━━━━━
⚡ 𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺 𝘋𝘦𝘭𝘵𝘢𝘉𝘺𝘵𝘦`
                })
            }

            const query = args.join(' ')
            
            await sock.sendMessage(chatId, {
                text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗕𝗨𝗦𝗖𝗔𝗡𝗗𝗢 ✦
━━━━━━━━━━━━━━━━━━━━━

🔍 "${query}"

⏳ Buscando videos...
━━━━━━━━━━━━━━━━━━━━━`
            })

            const results = await this.xnxxSearch(query)
            
            if (!results || results.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗦𝗜𝗡 𝗥𝗘𝗦𝗨𝗟𝗧𝗔𝗗𝗢𝗦 ✦
━━━━━━━━━━━━━━━━━━━━━

❌ No hay resultados para: "${query}"

💡 *Tip:* Intenta otros términos

━━━━━━━━━━━━━━━━━━━━━`
                })
            }

            let resultText = `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗥𝗘𝗦𝗨𝗟𝗧𝗔𝗗𝗢𝗦 ✦
━━━━━━━━━━━━━━━━━━━━━

🔍 *Búsqueda:* ${query.toUpperCase()}
📊 *Encontrados:* ${results.length} videos

━━━━━━━━━━━━━━━━━━━━━\n\n`

            results.forEach((video, i) => {
                resultText += `*[${i + 1}]*\n`
                resultText += `• 🎬 *Título:* ${video.title}\n`
                resultText += `• ❗ *Info:* ${video.info}\n`
                resultText += `• 🔗 *Link:* ${video.link}\n\n`
                resultText += '━━━━━━━━━━━━━━━━━━━━━\n\n'
            })

            resultText += `⚡ 𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺 𝘋𝘦𝘭𝘵𝘢𝘉𝘺𝘵𝘦`

            await sock.sendMessage(chatId, { 
                text: resultText 
            }, { quoted: msg })

        } catch (error) {
            console.error('Error en comando xnxx:', error)
            
            let errorMsg = '❌ Error al buscar videos'
            
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMsg = '⏱️ Timeout: El servidor tardó mucho\n\n💡 Intenta de nuevo en unos segundos'
            } else if (error.code === 'ENOTFOUND') {
                errorMsg = '🌐 No se pudo conectar al servidor\n\n💡 Verifica tu conexión'
            } else if (error.response?.status === 403) {
                errorMsg = '🚫 Acceso bloqueado por el servidor\n\n💡 Intenta más tarde'
            }
            
            await sock.sendMessage(chatId, {
                text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗘𝗥𝗥𝗢𝗥 ✦
━━━━━━━━━━━━━━━━━━━━━

${errorMsg}

━━━━━━━━━━━━━━━━━━━━━`
            })
        }
    },

    async xnxxSearch(query) {
        // Intentar primero con API (más confiable)
        try {
            return await this.xnxxSearchAPI(query)
        } catch (apiError) {
            console.log('API falló, intentando scraping directo...')
            // Si falla, intentar scraping directo
            return await this.xnxxSearchScraping(query)
        }
    },

    async xnxxSearchAPI(query) {
        try {
            const apiUrl = `https://raganork-api.vercel.app/api/nsfw/xnxxsearch?query=${encodeURIComponent(query)}`
            
            const response = await axios.get(apiUrl, {
                timeout: 20000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })

            if (response.data && response.data.data && response.data.data.length > 0) {
                return response.data.data.slice(0, 10).map(v => ({
                    title: v.title,
                    info: v.info || v.duration || 'N/A',
                    link: v.link
                }))
            }
            
            throw new Error('API sin resultados')
        } catch (error) {
            console.error('Error en API:', error.message)
            throw error
        }
    },

    async xnxxSearchScraping(query) {
        const maxRetries = 3
        let lastError = null

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Intento ${attempt}/${maxRetries} de scraping...`)
                
                const baseurl = 'https://www.xnxx.com'
                const page = Math.floor(Math.random() * 3) + 1
                
                const response = await axios.get(`${baseurl}/search/${encodeURIComponent(query)}/${page}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Cache-Control': 'max-age=0'
                    },
                    timeout: 30000, // 30 segundos
                    maxRedirects: 5,
                    validateStatus: (status) => status >= 200 && status < 300
                })

                const $ = cheerio.load(response.data, { xmlMode: false })
                const results = []
                const titles = []
                const urls = []
                const descs = []

                // Extraer URLs
                $('div.mozaique').each(function() {
                    $(this).find('div.thumb').each(function() {
                        const href = $(this).find('a').attr('href')
                        if (href) {
                            urls.push(baseurl + href.replace('/THUMBNUM/', '/'))
                        }
                    })
                })

                // Extraer títulos y descripciones
                $('div.mozaique').each(function() {
                    $(this).find('div.thumb-under').each(function() {
                        const metadata = $(this).find('p.metadata').text().trim()
                        descs.push(metadata || 'N/A')
                        $(this).find('a').each(function() {
                            const title = $(this).attr('title')
                            if (title) titles.push(title)
                        })
                    })
                })

                // Combinar resultados
                for (let i = 0; i < Math.min(titles.length, urls.length); i++) {
                    if (titles[i] && urls[i]) {
                        results.push({
                            title: titles[i],
                            info: descs[i] || 'N/A',
                            link: urls[i]
                        })
                    }
                }

                if (results.length > 0) {
                    console.log(`✓ Scraping exitoso: ${results.length} resultados`)
                    return results.slice(0, 10)
                }

                throw new Error('Sin resultados en el scraping')

            } catch (error) {
                lastError = error
                console.error(`Intento ${attempt} falló:`, error.message)
                
                if (attempt < maxRetries) {
                    const waitTime = attempt * 2000 // 2s, 4s, 6s
                    console.log(`Esperando ${waitTime}ms antes de reintentar...`)
                    await new Promise(resolve => setTimeout(resolve, waitTime))
                }
            }
        }

        throw new Error(`No se pudo realizar la búsqueda después de ${maxRetries} intentos: ${lastError?.message}`)
    }
}

export default xnxxCommand