import axios from 'axios'

const GOOGLE_FONTS_API_KEY = 'AIzaSyAOoK0yHDztbg9X_peAXU27Zirm9S9IQcY'

const fontCommand = {
    name: 'font',
    aliases: ['ttf', 'fuente'],
    category: 'tools',
    description: 'Busca y proporciona enlaces de descarga de fuentes de Google Fonts',
    usage: '#font [nombre de la fuente]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Google Fonts - Buscador* 《✧》\n\n` +
                        `Busca fuentes tipográficas profesionales gratuitas.\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #font roboto\n` +
                        `✿ #ttf montserrat\n` +
                        `✿ #fuente open sans\n\n` +
                        `💡 *Tip:* Todas las fuentes son gratuitas y de código abierto.`
                })
            }

            const query = args.join(' ').toLowerCase().trim()
            
            await sock.sendMessage(chatId, {
                text: `《✧》 🔍 Buscando "${query}"...\n\n⏳ Por favor espera...`
            })

            const fonts = await searchGoogleFonts(query)
            
            if (fonts.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No se encontraron fuentes\n\n' +
                        `Búsqueda: "${query}"\n\n` +
                        '💡 *Sugerencias:*\n' +
                        '• Verifica la ortografía\n' +
                        '• Prueba con: "roboto", "open sans", "lato", "montserrat"\n' +
                        '• Usa nombres más simples'
                })
            }

            const selectedFont = fonts[0]
            const downloadUrls = getFontDownloadUrls(selectedFont)
            
            // Mensaje con información de la fuente
            let fontInfo = `《✧》 ✅ *Fuente Encontrada* 《✧》\n\n`
            fontInfo += `🔤 *Nombre:* ${selectedFont.family}\n`
            fontInfo += `✦ *Categoría:* ${selectedFont.category}\n`
            fontInfo += `✦ *Variantes:* ${selectedFont.variants.length} estilos\n`
            fontInfo += `✦ *Idiomas:* ${selectedFont.subsets.join(', ')}\n\n`
            
            fontInfo += `📥 *Enlaces de descarga:*\n\n`
            
            // Agregar enlaces de descarga para cada variante
            downloadUrls.forEach((item, index) => {
                if (index < 5) { // Limitar a 5 variantes
                    fontInfo += `${index + 1}. *${item.variant}*\n`
                    fontInfo += `   ${item.url}\n\n`
                }
            })
            
            if (downloadUrls.length > 5) {
                fontInfo += `... y ${downloadUrls.length - 5} variantes más\n\n`
            }
            
            fontInfo += `🌐 *Ver en Google Fonts:*\n`
            fontInfo += `https://fonts.google.com/specimen/${selectedFont.family.replace(/\s/g, '+')}\n\n`
            fontInfo += `💡 *Instalación:*\n`
            fontInfo += `1. Descarga el archivo .ttf\n`
            fontInfo += `2. Haz doble clic para instalar\n`
            fontInfo += `3. Reinicia tus aplicaciones`
            
            await sock.sendMessage(chatId, { text: fontInfo }, { quoted: msg })
            
            // Mostrar alternativas si hay más resultados
            if (fonts.length > 1) {
                let alternatives = '《✧》 *Fuentes similares:*\n\n'
                for (let i = 1; i < Math.min(fonts.length, 5); i++) {
                    const font = fonts[i]
                    alternatives += `${i}. *${font.family}*\n`
                    alternatives += `   Categoría: ${font.category}\n`
                    alternatives += `   Variantes: ${font.variants.length}\n\n`
                }
                alternatives += `💡 Encontradas ${fonts.length} fuentes en total`
                
                await sock.sendMessage(chatId, { text: alternatives })
            }
            
        } catch (error) {
            console.error('Error en comando font:', error)
            
            let errorMessage = '《✧》 ❌ Error al procesar la solicitud\n\n'
            
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage += '⏱️ *Timeout:* La conexión tardó demasiado.\n'
                errorMessage += '💡 Intenta de nuevo en unos segundos.'
            } else if (error.response?.status === 403) {
                errorMessage += '🔑 *Error de API:* Verifica tu API Key de Google Fonts.\n'
                errorMessage += '💡 Obtén una gratis en: https://developers.google.com/fonts/docs/developer_api'
            } else if (error.response?.status === 429) {
                errorMessage += '⚠️ *Límite excedido:* Demasiadas solicitudes.\n'
                errorMessage += '💡 Espera unos minutos e intenta de nuevo.'
            } else if (error.message?.includes('ENOTFOUND')) {
                errorMessage += '🌐 *Sin conexión:* No se puede conectar con Google Fonts.\n'
                errorMessage += '💡 Verifica tu conexión a internet.'
            } else {
                errorMessage += `⚠️ *Error:* ${error.message || 'Desconocido'}\n\n`
                errorMessage += '💡 Intenta de nuevo o usa otro término de búsqueda.'
            }
            
            await sock.sendMessage(chatId, { text: errorMessage })
        }
    }
}

async function searchGoogleFonts(query) {
    try {
        // Usar la API de Google Fonts
        const apiUrl = `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`
        
        console.log('Consultando Google Fonts API...')
        
        const response = await axios.get(apiUrl, {
            timeout: 15000,
            headers: {
                'Accept': 'application/json'
            }
        })
        
        if (!response.data || !response.data.items) {
            console.error('Respuesta inválida de la API')
            return []
        }
        
        const allFonts = response.data.items
        console.log(`Total de fuentes disponibles: ${allFonts.length}`)
        
        // Filtrar fuentes que coincidan con la búsqueda
        const filtered = allFonts.filter(font => 
            font.family.toLowerCase().includes(query.toLowerCase())
        )
        
        console.log(`Fuentes encontradas para "${query}": ${filtered.length}`)
        
        return filtered
        
    } catch (error) {
        console.error('Error en searchGoogleFonts:', error.message)
        throw error
    }
}

function getFontDownloadUrls(font) {
    const downloadUrls = []
    
    // Google Fonts proporciona URLs directas para cada variante
    font.variants.forEach(variant => {
        if (font.files && font.files[variant]) {
            downloadUrls.push({
                variant: formatVariantName(variant),
                url: font.files[variant]
            })
        }
    })
    
    return downloadUrls
}

function formatVariantName(variant) {
    const names = {
        'regular': 'Regular',
        '100': 'Thin',
        '200': 'Extra Light',
        '300': 'Light',
        '400': 'Regular',
        '500': 'Medium',
        '600': 'Semi Bold',
        '700': 'Bold',
        '800': 'Extra Bold',
        '900': 'Black',
        '100italic': 'Thin Italic',
        '200italic': 'Extra Light Italic',
        '300italic': 'Light Italic',
        '400italic': 'Italic',
        'italic': 'Italic',
        '500italic': 'Medium Italic',
        '600italic': 'Semi Bold Italic',
        '700italic': 'Bold Italic',
        '800italic': 'Extra Bold Italic',
        '900italic': 'Black Italic'
    }
    
    return names[variant] || variant
}

export default fontCommand