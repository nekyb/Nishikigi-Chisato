import axios from 'axios'
import * as cheerio from 'cheerio'

const dafontCommand = {
    name: 'font',
    aliases: ['ttf', 'fuente'],
    category: 'tools',
    description: 'Busca y descarga fuentes tipográficas de DaFont',
    usage: '#font [nombre de la fuente]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *DaFont - Buscador de Fuentes* 《✧》\n\n` +
                        `Busca y descarga fuentes tipográficas profesionales.\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #font bebas neue\n` +
                        `✿ #ttf roboto\n` +
                        `✿ #fuente montserrat\n\n` +
                        `💡 *Tip:* Escribe el nombre exacto o aproximado de la fuente que buscas.`
                })
            }

            const query = args.join(' ').toLowerCase().trim()
            const searchResults = await searchDaFont(query)
            if (searchResults.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No se encontraron fuentes\n\n' +
                        `Búsqueda: "${query}"\n\n` +
                        '💡 *Sugerencias:*\n' +
                        '• Verifica la ortografía\n' +
                        '• Intenta con términos más simples\n' +
                        '• Busca fuentes populares: "bebas", "roboto", "montserrat"'
                })
            }

            const selectedFont = searchResults[0]
            await sock.sendMessage(chatId, {
                text: `《✧》 ✅ *Fuente encontrada* 《✧》\n\n` +
                    `🔤 *Nombre:* ${selectedFont.name}\n` +
                    `👤 *Autor:* ${selectedFont.author}\n` +
                    `🎨 *Estilos:* ${selectedFont.styles}\n\n` +
                    `⏳ Descargando archivo...`
            })

            const fontBuffer = await downloadFont(selectedFont.downloadUrl)
            if (!fontBuffer) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ Error al descargar la fuente\n\n' +
                        `📎 *Descarga manual:*\n${selectedFont.downloadUrl}\n\n` +
                        '💡 *Tip:* El enlace directo está disponible arriba.'
                })
            }

            await sock.sendMessage(chatId, {
                document: fontBuffer,
                fileName: `${selectedFont.name.replace(/\s+/g, '_')}.zip`,
                mimetype: 'application/zip',
                caption: `《✧》 *${selectedFont.name}* 《✧》\n\n` +
                    `👤 Autor: ${selectedFont.author}\n` +
                    `📦 Formato: TTF/OTF (ZIP)\n` +
                    `🎨 Estilos: ${selectedFont.styles}\n\n` +
                    `📝 *Instalación:*\n` +
                    `1. Descomprime el archivo ZIP\n` +
                    `2. Instala los archivos .ttf o .otf\n` +
                    `3. Reinicia tus aplicaciones`
            }, { quoted: msg })
            if (searchResults.length > 1) {
                let alternativesList = '《✧》 *Otras fuentes similares:*\n\n';
                for (let i = 1; i < Math.min(searchResults.length, 5); i++) {
                    const font = searchResults[i];
                    alternativesList += `${i}. *${font.name}*\n   Autor: ${font.author}\n\n`
                }
                alternativesList += `💡 Encontradas ${searchResults.length} fuentes en total`
                await sock.sendMessage(chatId, { text: alternativesList });
            }
        } catch (error) {
            console.error('Error en comando font:', error)
            let errorMessage = '《✧》 ❌ Error al procesar la solicitud\n\n'
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage += '⏱️ *Timeout:* La conexión tardó demasiado.\n' +
                    '💡 Intenta de nuevo en unos segundos.'
            } else if (error.response?.status === 404) {
                errorMessage += '🔗 *Error 404:* No se pudo conectar con DaFont.\n' +
                    '💡 El sitio puede estar caído temporalmente.'
            } else if (error.response?.status === 503) {
                errorMessage += '🚫 *Error 503:* DaFont no está disponible.\n' +
                    '💡 Intenta más tarde.'
            } else if (error.message?.includes('ENOTFOUND')) {
                errorMessage += '🌐 *Sin conexión:* No se puede resolver dafont.com\n' +
                    '💡 Verifica tu conexión a internet.'
            } else {
                errorMessage += `⚠️ *Error:* ${error.message || 'Desconocido'}\n\n` +
                    '💡 *Tip:* Verifica tu conexión e intenta con otro término.'
            } await sock.sendMessage(chatId, { text: errorMessage })
        }
    }
};

async function searchDaFont(query) {
    try {
        const searchUrl = `https://www.dafont.com/search.php?q=${encodeURIComponent(query)}`
        console.log('Buscando en:', searchUrl)
        const response = await axios.get(searchUrl, {
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.dafont.com/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400
        })

        const $ = cheerio.load(response.data)
        const results = []
        const fontContainers = $('.lv1left, .lv2left, div[style*="border"]')
        console.log('Contenedores encontrados:', fontContainers.length)
        fontContainers.each((index, element) => {
            try {
                const fontElement = $(element)
                const nameElement = fontElement.find('a.nb').first() || 
                                   fontElement.find('.dfbg a').first() ||
                                   fontElement.find('a[href*="/"]').first()
                const fontName = nameElement.text().trim()
                if (!fontName || fontName.length < 2) return
                let author = 'Desconocido'
                const authorElements = fontElement.find('.dfbg, span, div')
                authorElements.each((i, el) => {
                    const text = $(el).text().trim()
                    if (text.includes('Por ') || text.includes('By ')) {
                        author = text.replace(/Por |By /gi, '').trim()
                    }
                })

                let styles = 'Regular';
                fontElement.find('.dfbg, span').each((i, el) => {
                    const text = $(el).text().trim();
                    if (text.match(/\d+\s*style/i)) {
                        styles = text;
                    }
                })

                const downloadLink = fontElement.find('a[href*="dl.php"], a[href*="dl/?f="]').attr('href') ||
                                    fontElement.find('a.dl').attr('href');
                if (downloadLink && fontName) {
                    const fullDownloadUrl = downloadLink.startsWith('http')
                        ? downloadLink
                        : `https://www.dafont.com/${downloadLink.replace(/^\//, '')}`
                    results.push({
                        name: fontName,
                        author: author,
                        downloadUrl: fullDownloadUrl,
                        styles: styles
                    })
                    console.log('Fuente encontrada:', fontName)
                }
            } catch (err) {
                console.error('Error procesando elemento:', err)
            }
        })

        return results
    } catch (error) {
        console.error('Error en searchDaFont:', error.message)
        throw error
    }
}

async function downloadFont(downloadUrl) {
    try {
        console.log('Descargando desde:', downloadUrl)
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 45000,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Referer': 'https://www.dafont.com/',
                'Accept': 'application/zip,application/octet-stream,*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            },
            validateStatus: (status) => status >= 200 && status < 400
        })
        if (response.data && response.data.byteLength > 0) {
            console.log('Descarga exitosa:', response.data.byteLength, 'bytes')
            return Buffer.from(response.data)
        } else {
            console.error('Respuesta vacía')
            return null
        }
    } catch (error) {
        console.error('Error descargando fuente:', error.message)
        return null
    }
}

export default dafontCommand