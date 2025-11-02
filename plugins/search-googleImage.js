import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * Scraper de imágenes de Google sin Puppeteer
 * Usa múltiples estrategias para extraer URLs de imágenes
 */
class GoogleImageScraper {
    constructor() {
        this.baseUrl = 'https://www.google.com/search'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        }
        this.timeout = 15000
    }

    /**
     * Decodifica URLs escapadas de Google
     */
    decodeGoogleUrl(url) {
        try {
            // Google escapa las URLs de múltiples formas
            let decoded = url
            
            // Eliminar prefijos de Google
            decoded = decoded.replace(/^.*?imgurl=/, '')
            decoded = decoded.replace(/^.*?url=/, '')
            
            // Decodificar URL
            decoded = decodeURIComponent(decoded)
            
            // Limpiar parámetros adicionales
            const urlMatch = decoded.match(/(https?:\/\/[^&]+)/)
            if (urlMatch) {
                decoded = urlMatch[1]
            }
            
            return decoded
        } catch (error) {
            return url
        }
    }

    /**
     * Extrae imágenes del HTML usando selectores CSS
     */
    extractImagesFromHtml($) {
        const images = []
        
        // Estrategia 1: Buscar en elementos <img> con data-src
        $('img[data-src]').each((i, el) => {
            const src = $(el).attr('data-src')
            if (src && src.startsWith('http') && !src.includes('google.com/xjs')) {
                images.push({
                    url: src,
                    thumbnail: $(el).attr('src') || src,
                    title: $(el).attr('alt') || '',
                    width: parseInt($(el).attr('width')) || 0,
                    height: parseInt($(el).attr('height')) || 0
                })
            }
        })

        // Estrategia 2: Buscar en divs con background-image
        $('div[data-tbnid]').each((i, el) => {
            const $el = $(el)
            const style = $el.attr('style') || ''
            const bgMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/)
            
            if (bgMatch) {
                const url = this.decodeGoogleUrl(bgMatch[1])
                if (url.startsWith('http') && !url.includes('google.com')) {
                    images.push({
                        url: url,
                        thumbnail: url,
                        title: $el.attr('data-title') || '',
                        width: 0,
                        height: 0
                    })
                }
            }
        })

        // Estrategia 3: Buscar en los links de las imágenes
        $('a[href*="imgurl="]').each((i, el) => {
            const href = $(el).attr('href')
            const urlMatch = href.match(/imgurl=([^&]+)/)
            
            if (urlMatch) {
                const url = this.decodeGoogleUrl(urlMatch[1])
                if (url.startsWith('http')) {
                    const $img = $(el).find('img').first()
                    images.push({
                        url: url,
                        thumbnail: $img.attr('src') || url,
                        title: $img.attr('alt') || '',
                        width: parseInt($img.attr('width')) || 0,
                        height: parseInt($img.attr('height')) || 0
                    })
                }
            }
        })

        return images
    }

    /**
     * Extrae imágenes del JSON embebido en el HTML
     */
    extractImagesFromJson(html) {
        const images = []
        
        try {
            // Google incluye datos JSON en el HTML
            // Buscar patrones como: ["https://...",width,height]
            const jsonRegex = /\["(https?:\/\/[^"]+)",(\d+),(\d+)\]/g
            let match
            
            while ((match = jsonRegex.exec(html)) !== null) {
                const url = match[1]
                const width = parseInt(match[2]) || 0
                const height = parseInt(match[3]) || 0
                
                // Filtrar URLs de Google y tracking
                if (!url.includes('google.com') && 
                    !url.includes('gstatic.com') &&
                    !url.includes('googleusercontent.com/') &&
                    (url.endsWith('.jpg') || url.endsWith('.jpeg') || 
                     url.endsWith('.png') || url.endsWith('.webp') ||
                     url.includes('/images/') || url.includes('/img/'))) {
                    
                    images.push({
                        url: url,
                        thumbnail: url,
                        title: '',
                        width: width,
                        height: height
                    })
                }
            }

            // Buscar también en estructuras AF_initDataCallback
            const afRegex = /AF_initDataCallback\((.*?)\);/gs
            const afMatches = html.match(afRegex) || []
            
            for (const afMatch of afMatches) {
                try {
                    // Extraer URLs de imágenes del callback
                    const urlMatches = afMatch.match(/"(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/g) || []
                    
                    for (const urlMatch of urlMatches) {
                        const url = urlMatch.replace(/"/g, '')
                        if (!url.includes('google.com') && !url.includes('gstatic.com')) {
                            images.push({
                                url: url,
                                thumbnail: url,
                                title: '',
                                width: 0,
                                height: 0
                            })
                        }
                    }
                } catch (e) {
                    continue
                }
            }
        } catch (error) {
            console.error('Error extrayendo JSON:', error.message)
        }
        
        return images
    }

    /**
     * Valida que una URL de imagen sea accesible
     */
    async validateImage(url, timeout = 5000) {
        try {
            const response = await axios.head(url, {
                timeout: timeout,
                maxRedirects: 3,
                validateStatus: (status) => status < 400
            })

            const contentType = response.headers['content-type'] || ''
            const isImage = contentType.startsWith('image/')
            
            return isImage
        } catch (error) {
            return false
        }
    }

    /**
     * Filtra y limpia la lista de imágenes
     */
    async filterImages(images, validate = true) {
        const seen = new Set()
        const filtered = []

        for (const img of images) {
            // Evitar duplicados
            if (seen.has(img.url)) continue
            seen.add(img.url)

            // Filtrar URLs inválidas
            if (!img.url.startsWith('http')) continue
            if (img.url.length > 2000) continue // URLs muy largas suelen ser inválidas
            
            // Filtrar dominios problemáticos
            const domain = new URL(img.url).hostname
            if (domain.includes('google.com') || 
                domain.includes('gstatic.com') ||
                domain.includes('googleusercontent.com')) {
                continue
            }

            filtered.push(img)
        }

        // Validar URLs si se solicita
        if (validate && filtered.length > 0) {
            console.log(`🔍 Validando ${Math.min(filtered.length, 10)} imágenes...`)
            
            const validatedImages = []
            
            // Validar las primeras imágenes
            for (const img of filtered.slice(0, 10)) {
                const isValid = await this.validateImage(img.url)
                if (isValid) {
                    validatedImages.push(img)
                    if (validatedImages.length >= 5) break // Suficientes imágenes validadas
                }
            }
            
            return validatedImages.length > 0 ? validatedImages : filtered.slice(0, 5)
        }

        return filtered.slice(0, 10)
    }

    /**
     * Busca imágenes en Google
     */
    async search(query, options = {}) {
        const {
            num = 5,
            safe = 'off',
            validate = true,
            imageType = 'photo', // photo, face, clipart, lineart, animated
            imageSize = '', // large, medium, icon
            imageColor = '' // color, gray, trans
        } = options

        try {
            console.log('🔍 Buscando imágenes en Google:', query)

            // Construir URL de búsqueda
            const params = new URLSearchParams({
                q: query,
                tbm: 'isch', // Búsqueda de imágenes
                safe: safe,
                hl: 'en'
            })

            // Filtros adicionales
            let tbs = []
            if (imageType && imageType !== 'photo') {
                tbs.push(`itp:${imageType}`)
            }
            if (imageSize) {
                tbs.push(`isz:${imageSize}`)
            }
            if (imageColor) {
                tbs.push(`ic:${imageColor}`)
            }
            if (tbs.length > 0) {
                params.append('tbs', tbs.join(','))
            }

            const searchUrl = `${this.baseUrl}?${params.toString()}`
            console.log('📍 URL:', searchUrl)

            // Realizar búsqueda
            const response = await axios.get(searchUrl, {
                headers: this.headers,
                timeout: this.timeout,
                maxRedirects: 5
            })

            const html = response.data
            const $ = cheerio.load(html)

            console.log('✅ Página cargada, extrayendo imágenes...')

            // Estrategia 1: Extraer del HTML
            let images = this.extractImagesFromHtml($)
            console.log(`📊 Imágenes del HTML: ${images.length}`)

            // Estrategia 2: Extraer del JSON embebido
            const jsonImages = this.extractImagesFromJson(html)
            console.log(`📊 Imágenes del JSON: ${jsonImages.length}`)
            
            images = [...images, ...jsonImages]

            // Filtrar y validar imágenes
            const filteredImages = await this.filterImages(images, validate)
            console.log(`✅ Imágenes finales: ${filteredImages.length}`)

            return {
                success: true,
                images: filteredImages.slice(0, num),
                total: filteredImages.length,
                query: query
            }

        } catch (error) {
            console.error('❌ Error en búsqueda:', error.message)
            
            return {
                success: false,
                error: error.message,
                images: [],
                query: query
            }
        }
    }

    /**
     * Obtiene una imagen aleatoria de los resultados
     */
    async searchRandom(query, options = {}) {
        const result = await this.search(query, { ...options, num: 10 })
        
        if (result.success && result.images.length > 0) {
            const randomIndex = Math.floor(Math.random() * result.images.length)
            return {
                success: true,
                image: result.images[randomIndex],
                total: result.images.length
            }
        }
        
        return result
    }
}

// Comando para WhatsApp
const googleimageCommand = {
    name: 'gimage',
    aliases: ['img', 'imagen', 'googleimg'],
    category: 'search',
    description: 'Busca imágenes en Google sin usar Puppeteer',
    usage: '#gimage [búsqueda]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        
        try {
            // Validar entrada
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Uso incorrecto del comando*\n\n' +
                        '📌 Ejemplos:\n' +
                        '✿ #gimage gato\n' +
                        '✿ #img paisaje montaña\n' +
                        '✿ #imagen anime girl\n\n' +
                        '💡 También puedes usar filtros:\n' +
                        '✿ #gimage perro -animated (para GIFs)\n' +
                        '✿ #gimage logo -clipart (para cliparts)'
                })
            }

            const query = args.join(' ')
            
            // Mensaje de búsqueda
            await sock.sendMessage(chatId, {
                text: `《✧》 🔍 Buscando imágenes...\n📝 Búsqueda: *${query}*\n\n⏳ Esto puede tardar unos segundos...`
            })

            // Detectar filtros en la query
            const options = {
                num: 5,
                validate: true
            }

            if (query.includes('-animated')) {
                options.imageType = 'animated'
            } else if (query.includes('-clipart')) {
                options.imageType = 'clipart'
            } else if (query.includes('-lineart')) {
                options.imageType = 'lineart'
            }

            if (query.includes('-large')) {
                options.imageSize = 'large'
            } else if (query.includes('-medium')) {
                options.imageSize = 'medium'
            }

            // Limpiar query de filtros
            const cleanQuery = query
                .replace(/-animated/g, '')
                .replace(/-clipart/g, '')
                .replace(/-lineart/g, '')
                .replace(/-large/g, '')
                .replace(/-medium/g, '')
                .trim()

            // Realizar búsqueda
            const scraper = new GoogleImageScraper()
            const result = await scraper.searchRandom(cleanQuery, options)

            if (!result.success) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ Error al buscar imágenes\n\n` +
                          `💬 Detalles: ${result.error}\n\n` +
                          `💡 *Sugerencias:*\n` +
                          `• Verifica tu conexión\n` +
                          `• Intenta con otra búsqueda\n` +
                          `• Google puede estar bloqueando las peticiones`
                })
            }

            if (!result.image) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 😔 No encontré imágenes para: *${cleanQuery}*\n\n` +
                          `💡 *Sugerencias:*\n` +
                          `• Intenta con términos en inglés\n` +
                          `• Usa palabras clave más específicas\n` +
                          `• Verifica la ortografía`
                })
            }

            // Enviar imagen
            const caption = `《✧》 🖼️ *Resultado de búsqueda*\n\n` +
                          `📝 Búsqueda: *${cleanQuery}*\n` +
                          (result.image.title ? `📌 Título: ${result.image.title}\n` : '') +
                          (result.image.width && result.image.height ? 
                           `📐 Tamaño: ${result.image.width}x${result.image.height}\n` : '') +
                          `\n💡 Hay ${result.total} imágenes disponibles`

            await sock.sendMessage(chatId, {
                image: { url: result.image.url },
                caption: caption
            }, { quoted: msg })

        } catch (error) {
            console.error('❌ Error en comando gimage:', error)
            
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error inesperado al buscar imágenes\n\n` +
                      `💬 ${error.message}\n\n` +
                      `💡 Por favor intenta de nuevo más tarde`
            })
        }
    }
}

export default googleimageCommand
export { GoogleImageScraper }