import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * Scraper de SoundCloud con múltiples estrategias de extracción
 */
class SoundCloudScraper {
    constructor() {
        this.baseUrl = 'https://soundcloud.com'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        this.timeout = 15000
    }

    /**
     * Extrae el client_id de SoundCloud desde el HTML
     */
    async extractClientId(html) {
        try {
            // Buscar scripts que contengan el client_id
            const scriptRegex = /<script[^>]*src="([^"]*)"[^>]*>/g
            const scripts = []
            let match
            
            while ((match = scriptRegex.exec(html)) !== null) {
                if (match[1].includes('soundcloud.com')) {
                    scripts.push(match[1])
                }
            }

            // Intentar obtener el client_id de los scripts
            for (const scriptUrl of scripts) {
                try {
                    const { data } = await axios.get(scriptUrl, {
                        headers: this.headers,
                        timeout: this.timeout
                    })
                    
                    const clientIdMatch = data.match(/client_id[=:]"?([a-zA-Z0-9]+)"?/)
                    if (clientIdMatch) {
                        return clientIdMatch[1]
                    }
                } catch (e) {
                    continue
                }
            }

            // Buscar directamente en el HTML
            const directMatch = html.match(/client_id[=:]"?([a-zA-Z0-9]+)"?/)
            if (directMatch) {
                return directMatch[1]
            }

            return null
        } catch (error) {
            console.error('Error extrayendo client_id:', error.message)
            return null
        }
    }

    /**
     * Extrae datos estructurados de JSON-LD embebido
     */
    extractJsonLd($) {
        const tracks = []
        
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const jsonData = JSON.parse($(el).html())
                
                if (jsonData['@type'] === 'MusicRecording' || 
                    jsonData['@type'] === 'AudioObject') {
                    tracks.push({
                        title: jsonData.name || '',
                        artist: jsonData.byArtist?.name || jsonData.author?.name || '',
                        url: jsonData.url || '',
                        duration: jsonData.duration || '',
                        thumbnail: jsonData.thumbnailUrl || jsonData.image || ''
                    })
                }
            } catch (e) {
                // JSON inválido, continuar
            }
        })
        
        return tracks
    }

    /**
     * Extrae datos del JSON embebido en el HTML (hydration data)
     */
    extractHydrationData(html) {
        try {
            // SoundCloud usa hydration data en el HTML
            const hydrationMatch = html.match(/window\.__sc_hydration\s*=\s*(\[.*?\]);/s)
            
            if (!hydrationMatch) {
                return []
            }

            const hydrationData = JSON.parse(hydrationMatch[1])
            const tracks = []

            // Buscar en el hydration data
            for (const item of hydrationData) {
                if (item.hydratable === 'sound' && item.data) {
                    const track = item.data
                    tracks.push({
                        title: track.title || '',
                        artist: track.user?.username || '',
                        url: track.permalink_url || '',
                        duration: this.formatDuration(track.duration),
                        thumbnail: track.artwork_url || track.user?.avatar_url || '',
                        playCount: track.playback_count || 0,
                        likeCount: track.likes_count || 0
                    })
                }

                // También buscar en colecciones de búsqueda
                if (item.hydratable === 'search' && item.data?.collection) {
                    for (const result of item.data.collection) {
                        if (result.kind === 'track') {
                            tracks.push({
                                title: result.title || '',
                                artist: result.user?.username || '',
                                url: result.permalink_url || '',
                                duration: this.formatDuration(result.duration),
                                thumbnail: result.artwork_url || result.user?.avatar_url || '',
                                playCount: result.playback_count || 0,
                                likeCount: result.likes_count || 0
                            })
                        }
                    }
                }
            }

            return tracks
        } catch (error) {
            console.error('Error extrayendo hydration data:', error.message)
            return []
        }
    }

    /**
     * Extrae datos usando selectores CSS tradicionales
     */
    extractFromSelectors($) {
        const tracks = []
        
        // Múltiples selectores posibles (SoundCloud cambia su estructura frecuentemente)
        const selectors = [
            '.searchList__item',
            '.soundList__item',
            '[class*="SearchItem"]',
            'article[class*="track"]',
            'li[class*="searchItem"]'
        ]

        for (const selector of selectors) {
            const items = $(selector)
            
            if (items.length > 0) {
                items.slice(0, 10).each((i, el) => {
                    const $el = $(el)
                    
                    // Intentar múltiples selectores para cada campo
                    const titleSelectors = [
                        '.soundTitle__title',
                        '[class*="TrackItem__title"]',
                        'a[class*="title"]',
                        'h2 a',
                        '[itemprop="name"]'
                    ]
                    
                    const artistSelectors = [
                        '.soundTitle__username',
                        '[class*="TrackItem__username"]',
                        'a[class*="username"]',
                        '[itemprop="byArtist"]'
                    ]

                    let title = ''
                    let titleLink = ''
                    let artist = ''

                    // Buscar título
                    for (const sel of titleSelectors) {
                        const el = $el.find(sel).first()
                        if (el.length > 0) {
                            title = el.attr('title') || el.text().trim()
                            titleLink = el.attr('href') || ''
                            if (title) break
                        }
                    }

                    // Buscar artista
                    for (const sel of artistSelectors) {
                        const el = $el.find(sel).first()
                        if (el.length > 0) {
                            artist = el.text().trim()
                            if (artist) break
                        }
                    }

                    // Buscar thumbnail
                    const thumbnail = $el.find('img').first().attr('src') || ''

                    if (title && titleLink) {
                        const fullUrl = titleLink.startsWith('http') 
                            ? titleLink 
                            : this.baseUrl + titleLink

                        tracks.push({
                            title: this.cleanText(title),
                            artist: this.cleanText(artist),
                            url: fullUrl,
                            thumbnail: thumbnail,
                            duration: '',
                            playCount: 0,
                            likeCount: 0
                        })
                    }
                })

                if (tracks.length > 0) break
            }
        }

        return tracks
    }

    /**
     * Formatea la duración en milisegundos a formato legible
     */
    formatDuration(ms) {
        if (!ms) return ''
        
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    /**
     * Limpia texto de caracteres especiales y espacios extra
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n/g, '')
            .trim()
    }

    /**
     * Formatea números grandes (ej: 1500000 -> 1.5M)
     */
    formatNumber(num) {
        if (!num) return '0'
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M'
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K'
        }
        return num.toString()
    }

    /**
     * Busca canciones en SoundCloud
     */
    async search(query, limit = 5) {
        try {
            const searchUrl = `${this.baseUrl}/search/sounds?q=${encodeURIComponent(query)}`
            
            console.log('🔍 Buscando en SoundCloud:', query)
            console.log('📍 URL:', searchUrl)

            const response = await axios.get(searchUrl, {
                headers: this.headers,
                timeout: this.timeout,
                maxRedirects: 5
            })

            const html = response.data
            const $ = cheerio.load(html)

            console.log('✅ Página cargada, extrayendo datos...')

            // Estrategia 1: Hydration data (más confiable)
            let tracks = this.extractHydrationData(html)
            console.log(`📊 Hydration data: ${tracks.length} canciones`)

            // Estrategia 2: JSON-LD
            if (tracks.length === 0) {
                tracks = this.extractJsonLd($)
                console.log(`📊 JSON-LD: ${tracks.length} canciones`)
            }

            // Estrategia 3: Selectores CSS
            if (tracks.length === 0) {
                tracks = this.extractFromSelectors($)
                console.log(`📊 Selectores CSS: ${tracks.length} canciones`)
            }

            // Limitar resultados
            const limitedTracks = tracks.slice(0, limit)

            console.log(`✅ Total encontrado: ${limitedTracks.length} canciones`)

            return {
                success: true,
                tracks: limitedTracks,
                total: tracks.length
            }

        } catch (error) {
            console.error('❌ Error en scraper:', error.message)
            
            return {
                success: false,
                error: error.message,
                tracks: []
            }
        }
    }
}

// Comando para WhatsApp
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
                        '📌 Ejemplo:\n' +
                        '✿ #scsearch lo-fi hip hop\n' +
                        '✿ #sc despacito\n' +
                        '✿ #soundcloud jazz music'
                })
            }

            const query = args.join(' ')
            
            await sock.sendMessage(chatId, {
                text: '《✧》 🔍 Buscando en SoundCloud...\n' +
                      `📝 Consulta: *${query}*`
            })

            const scraper = new SoundCloudScraper()
            const result = await scraper.search(query, 5)

            if (!result.success) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ Error al conectar con SoundCloud.\n\n' +
                          `💬 Detalles: ${result.error}\n\n` +
                          '💡 *Tip:* Intenta de nuevo en unos momentos.'
                })
            }

            if (result.tracks.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 🔍 No encontré resultados para: *${query}*\n\n` +
                          '💡 *Sugerencias:*\n' +
                          '• Verifica la ortografía\n' +
                          '• Usa términos más generales\n' +
                          '• Intenta con el nombre del artista'
                })
            }

            // Formatear respuesta
            let responseText = `╔═══《 🎵 SOUNDCLOUD SEARCH 》═══╗\n`
            responseText += `║ 📝 Búsqueda: *${query}*\n`
            responseText += `║ 📊 Encontrados: *${result.total}* (mostrando ${result.tracks.length})\n`
            responseText += `║\n`

            result.tracks.forEach((track, i) => {
                responseText += `╠═══ 🎵 *${i + 1}.* ${track.title}\n`
                
                if (track.artist) {
                    responseText += `║ 👤 Artista: ${track.artist}\n`
                }
                
                if (track.duration) {
                    responseText += `║ ⏱️ Duración: ${track.duration}\n`
                }
                
                if (track.playCount > 0) {
                    responseText += `║ ▶️ Reproducciones: ${scraper.formatNumber(track.playCount)}\n`
                }
                
                if (track.likeCount > 0) {
                    responseText += `║ 💙 Me gusta: ${scraper.formatNumber(track.likeCount)}\n`
                }
                
                responseText += `║ 🔗 ${track.url}\n`
                responseText += `║\n`
            })

            responseText += `╚══════════════════════════════════╝\n`
            responseText += `\n💡 *Tip:* Copia el link para escuchar en SoundCloud`

            await sock.sendMessage(chatId, {
                text: responseText
            }, { quoted: msg })

        } catch (error) {
            console.error('❌ Error en comando scsearch:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Error inesperado al buscar en SoundCloud.\n\n' +
                      '💡 Por favor intenta de nuevo más tarde.'
            })
        }
    }
}

export default scsearchCommand
export { SoundCloudScraper }