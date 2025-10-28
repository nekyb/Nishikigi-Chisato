import axios from 'axios';
import * as cheerio from 'cheerio';
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
        const chatId = msg.key.remoteJid;
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
                });
            }
            const query = args.join(' ').toLowerCase().trim();
            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando fuente en DaFont...'
            });
            const searchResults = await searchDaFont(query);
            if (searchResults.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se encontraron fuentes con ese nombre.\n\n' +
                        '💡 *Tip:* Intenta con otro nombre o verifica la ortografía.'
                });
            }
            const selectedFont = searchResults[0];
            await sock.sendMessage(chatId, {
                text: `《✧》 *Fuente encontrada* 《✧》\n\n` +
                    `✿ *Nombre:* ${selectedFont.name}\n` +
                    `✿ *Autor:* ${selectedFont.author}\n` +
                    `✿ *Estilos:* ${selectedFont.styles}\n\n` +
                    `Descargando archivo...`
            });
            const fontBuffer = await downloadFont(selectedFont.downloadUrl);
            if (!fontBuffer) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al descargar la fuente.\n\n' +
                        '💡 *Tip:* El enlace puede haber expirado. Intenta de nuevo.'
                });
            }
            await sock.sendMessage(chatId, {
                document: fontBuffer,
                fileName: `${selectedFont.name.replace(/\s+/g, '_')}.zip`,
                mimetype: 'application/zip',
                caption: `《✧》 *${selectedFont.name}* 《✧》\n\n` +
                    `✿ Autor: ${selectedFont.author}\n` +
                    `✿ Formato: TTF/OTF (ZIP)\n\n` +
                    `Descomprime el archivo para instalar la fuente en tu sistema.`
            }, { quoted: msg });
            if (searchResults.length > 1) {
                let alternativesList = '《✧》 *Otras fuentes similares encontradas:*\n\n';
                for (let i = 1; i < Math.min(searchResults.length, 4); i++) {
                    const font = searchResults[i];
                    alternativesList += `${i}. ${font.name}\n   Autor: ${font.author}\n\n`;
                }
                alternativesList += '💡 *Tip:* Usa el nombre exacto para buscar estas alternativas.';
                await sock.sendMessage(chatId, {
                    text: alternativesList
                });
            }
        }
        catch (error) {
            console.error('Error en comando font:', error);
            let errorMessage = '《✧》 Error al buscar la fuente.';
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La búsqueda tardó demasiado. Intenta de nuevo.';
            }
            else if (error.response?.status === 404) {
                errorMessage = '《✧》 No se pudo conectar con DaFont.';
            }
            else if (error.response?.status === 503) {
                errorMessage = '《✧》 DaFont no está disponible temporalmente.';
            }
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Verifica tu conexión e intenta con otro término de búsqueda.`
            });
        }
    }
};
async function searchDaFont(query) {
    const searchUrl = `https://www.dafont.com/search.php?q=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Referer': 'https://www.dafont.com/'
        }
    });
    const $ = cheerio.load(response.data);
    const results = [];
    $('.lv1left').each((index, element) => {
        const fontElement = $(element);
        const nameElement = fontElement.find('.dfbg a').first();
        const fontName = nameElement.text().trim();
        if (!fontName)
            return;
        const authorElement = fontElement.find('.dfbg').eq(1);
        const authorText = authorElement.text().trim();
        const author = authorText.replace('Por ', '').replace('By ', '').trim() || 'Desconocido';
        const styleElement = fontElement.find('.dfbg').eq(2);
        const styles = styleElement.text().trim() || 'Regular';
        const downloadLink = fontElement.find('a[href*="dl/?f="]').attr('href');
        const previewImg = fontElement.find('img').attr('src');
        if (downloadLink) {
            const fullDownloadUrl = downloadLink.startsWith('http')
                ? downloadLink
                : `https://www.dafont.com/${downloadLink}`;
            const fullPreviewUrl = previewImg && previewImg.startsWith('http')
                ? previewImg
                : previewImg ? `https://www.dafont.com${previewImg}` : '';
            results.push({
                name: fontName,
                author: author,
                downloadUrl: fullDownloadUrl,
                previewUrl: fullPreviewUrl,
                styles: styles
            });
        }
    });
    return results;
}
async function downloadFont(downloadUrl) {
    try {
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.dafont.com/',
                'Accept': 'application/zip,application/octet-stream,*/*'
            }
        });
        return Buffer.from(response.data);
    }
    catch (error) {
        console.error('Error descargando fuente:', error);
        return null;
    }
}
export default dafontCommand;