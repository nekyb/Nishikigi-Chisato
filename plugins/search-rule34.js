import axios from 'axios';
import { getGroupSettings } from '../database/users.js';

const rule34Command = {
    name: 'rule34',
    aliases: ['r34', 'rule', 'hentai'],
    category: 'nsfw',
    description: 'Busca imágenes en Rule34',
    usage: '#rule34 <término>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        try {
            if (isGroup) {
                const groupSettings = getGroupSettings(chatId);
                if (!groupSettings || !groupSettings.nsfwEnabled) {
                    return await sock.sendMessage(chatId, {
                        text: '《✗》 *NSFW Deshabilitado*\n\n' +
                            '❌ El contenido NSFW está deshabilitado en este grupo.\n\n' +
                            '💡 *Un administrador puede habilitarlo con:*\n' +
                            '✿ #porn on',
                        contextInfo: {
                            mentionedJid: [msg.key.participant]
                        }
                    }, { quoted: msg });
                }
            }

            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✗》 *Búsqueda Rule34*\n\n' +
                        '❌ Debes especificar un término de búsqueda.\n\n' +
                        '💡 *Ejemplo:*\n' +
                        '✿ #rule34 2b\n' +
                        '✿ #r34 miku\n' +
                        '✿ #hentai rem',
                    contextInfo: {
                        mentionedJid: [msg.key.participant]
                    }
                }, { quoted: msg });
            }

            const query = args.join(' ');
            await sock.sendMessage(chatId, {
                text: '《✿》 Buscando en Rule34...'
            });

            let searchResult;
            try {
                const response = await axios.get(`https://api.delirius.store/search/rule34?query=${encodeURIComponent(query)}`, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.data || !response.data.data || response.data.data.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: `《✗》 No se encontraron resultados para "${query}"\n\n` +
                            `💡 *Tips:*\n` +
                            `✿ Intenta con otro término\n` +
                            `✿ Verifica la ortografía\n` +
                            `✿ Usa palabras más comunes`,
                        contextInfo: {
                            mentionedJid: [msg.key.participant]
                        }
                    }, { quoted: msg });
                }

                searchResult = response.data.data[0];
            } catch (apiError) {
                console.error('Error con API Delirius Rule34:', apiError.message);
                return await sock.sendMessage(chatId, {
                    text: '《✗》 Error al conectar con el servicio de búsqueda.\n\n' +
                        '💡 Intenta más tarde.',
                    contextInfo: {
                        mentionedJid: [msg.key.participant]
                    }
                }, { quoted: msg });
            }

            if (!searchResult.url && !searchResult.image) {
                return await sock.sendMessage(chatId, {
                    text: '《✗》 No se pudo obtener la imagen.\n\n' +
                        '💡 Intenta con otro término.',
                    contextInfo: {
                        mentionedJid: [msg.key.participant]
                    }
                }, { quoted: msg });
            }

            const imageUrl = searchResult.url || searchResult.image;
            let imageBuffer;
            try {
                const imageResponse = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                imageBuffer = Buffer.from(imageResponse.data);
            } catch (downloadError) {
                console.error('Error descargando imagen:', downloadError.message);
                return await sock.sendMessage(chatId, {
                    text: '《✗》 Error al descargar la imagen.\n\n' +
                        '💡 Intenta de nuevo más tarde.',
                    contextInfo: {
                        mentionedJid: [msg.key.participant]
                    }
                }, { quoted: msg });
            }

            const title = searchResult.title || searchResult.name || query;
            const source = searchResult.source || 'Rule34';
            const info = `《✿》 *Resultado Rule34*\n\n` +
                `✦ *Búsqueda:* ${query}\n` +
                `✦ *Fuente:* ${source}\n` +
                `✦ *Enlace:* ${imageUrl.substring(0, 50)}...`;
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: info
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en comando rule34:', error);
            let errorMessage = '《✗》 Error al buscar en Rule34.';

            if (error.message?.includes('timeout')) {
                errorMessage = '《✗》 La búsqueda tardó demasiado. Intenta de nuevo.';
            } else if (error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
                errorMessage = '《✗》 Error de conexión. Verifica tu internet.';
            }

            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Intenta con un término más específico`,
                contextInfo: {
                    mentionedJid: [msg.key.participant]
                }
            }, { quoted: msg });
        }
    }
};

export default rule34Command;
