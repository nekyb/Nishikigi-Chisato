// Créditos del código DanielDiod - Adaptado para Nishikigi Chisato Bot

import cheerio from 'cheerio';
import axios from 'axios';
import { getGroupSettings } from '../database/users.js';

export default {
    name: 'pornhubsearch',
    aliases: ['phsearch', 'pornhubsearch'],
    category: 'nsfw',
    description: 'Busca videos en Pornhub',
    usage: '#pornhubsearch [búsqueda]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    nsfw: true,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        // Verificar si NSFW está activado en el grupo
        if (isGroup) {
            const settings = await getGroupSettings(chatId);
            if (!settings?.nsfwEnabled) {
                return await sock.sendMessage(chatId, {
                    text: `[❗] 𝐋𝐨𝐬 𝐜𝐨𝐦𝐚𝐧𝐝𝐨𝐬 +𝟏𝟖 𝐞𝐬𝐭𝐚́𝐧 𝐝𝐞𝐬𝐚𝐜𝐭𝐢𝐯𝐚𝐝𝐨𝐬 𝐞𝐧 𝐞𝐬𝐭𝐞 𝐠𝐫𝐮𝐩𝐨.\n> 𝐬𝐢 𝐞𝐬 𝐚𝐝𝐦𝐢𝐧 𝐲 𝐝𝐞𝐬𝐞𝐚 𝐚𝐜𝐭𝐢𝐯𝐚𝐫𝐥𝐨𝐬 𝐮𝐬𝐞 .porn on`
                }, { quoted: msg });
            }
        }

        // Validar que hay búsqueda
        if (!args[0]) {
            return await sock.sendMessage(chatId, {
                text: `🍭 Por favor, ingresa la búsqueda que deseas realizar en Pornhub.\n\nEjemplo: #pornhubsearch [término de búsqueda]`
            }, { quoted: msg });
        }

        const searchQuery = args.join(' ');
        
        try {
            await sock.sendMessage(chatId, {
                text: '🔍 Buscando en Pornhub... Por favor espera.'
            }, { quoted: msg });

            const searchResults = await searchPornhub(searchQuery);
            
            if (searchResults.result.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '🍭 No se encontraron resultados en Pornhub.'
                }, { quoted: msg });
            }

            let teks = `『 *P O R N H U B  -  S E A R C H* 』\n\n`;
            
            searchResults.result.forEach((v, i) => {
                teks += `${i + 1}. 🎞️ *Título:* ${v.title}\n`;
                teks += `   🕒 *Duración:* ${v.duration}\n`;
                teks += `   👀 *Vistas:* ${v.views}\n`;
                teks += `   🔗 *Link:* ${v.url}\n\n`;
                teks += `─────────────────────\n\n`;
            });

            await sock.sendMessage(chatId, {
                text: teks
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ Error en búsqueda de Pornhub:', error.message);
            await sock.sendMessage(chatId, {
                text: `⚠️ Ocurrió un error al buscar en Pornhub: ${error.message}`
            }, { quoted: msg });
        }
    }
};

/**
 * Función para buscar videos en Pornhub
 * @param {string} search - Término de búsqueda
 * @returns {Object} Objeto con array de resultados
 */
async function searchPornhub(search) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9',
            'Cache-Control': 'no-cache'
        };

        const response = await axios.get(
            `https://www.pornhub.com/video/search?search=${encodeURIComponent(search)}`,
            { headers, timeout: 10000 }
        );

        const html = response.data;
        const $ = cheerio.load(html);
        const result = [];

        // Selectores alternativos para diferentes estructuras HTML
        $('ul#videoSearchResult > li.pcVideoListItem, div.nf_videos_grid_item').each(function() {
            try {
                const $item = $(this);
                const $link = $item.find('a');
                const _title = $link.attr('title') || $link.find('.title')?.text()?.trim() || 'Sin título';
                const _duration = $item.find('var.duration, span.duration').text().trim() || 'N/A';
                const _views = $item.find('var.views, span.views').text().trim() || 'N/A';
                const href = $link.attr('href') || '';
                const _url = href.startsWith('http') ? href : `https://www.pornhub.com${href}`;

                if (_title && _url.includes('pornhub.com')) {
                    result.push({
                        title: _title.substring(0, 50), // Limitar título
                        duration: _duration,
                        views: _views,
                        url: _url
                    });
                }
            } catch (itemError) {
                console.error('Error procesando item:', itemError.message);
            }
        });

        return { result: result.slice(0, 5) }; // Retornar máximo 5 resultados
    } catch (error) {
        console.error('⚠️ Error al buscar en Pornhub:', error.message);
        return { result: [] };
    }
}
