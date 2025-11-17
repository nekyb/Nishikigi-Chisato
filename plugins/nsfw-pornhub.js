
import fetch from 'node-fetch';
import { getGroupSettings } from '../database/users.js';

export default {
    name: 'pornhubdl',
    aliases: ['phdll'],
    category: 'nsfw',
    description: 'Descarga videos de Pornhub',
    usage: '#phdll [url]',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            const settings = await getGroupSettings(chatId);
            if (!settings?.nsfwEnabled) {
                return await sock.sendMessage(chatId, {
                    text: '🔞 Los comandos NSFW están desactivados en este grupo.\n\n' +
                        'Un administrador debe activarlos con: .porn on'
                }, { quoted: msg });
            }

            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `🍭 Por favor ingrese el enlace del video de Pornhub.\n\n` +
                        `Ejemplo: #phdll https://www.pornhub.com/view_video.php?viewkey=XXXX`
                }, { quoted: msg });
            }

            const url = args[0];
            if (!url.includes('pornhub.com')) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Por favor ingresa un enlace válido de Pornhub.'
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, {
                react: { text: '⏱', key: msg.key }
            });

            const apiUrl = `https://www.dark-yasiya-api.site/download/phub?url=${encodeURIComponent(url)}`;
            let json = null;
            let lastError = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 30000 * attempt); 
                    const res = await fetch(apiUrl, {
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json',
                        }
                    });
                    
                    clearTimeout(timeout);
                    
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`);
                    }
                    
                    json = await res.json();
                    break; 
                } catch (err) {
                    lastError = err;
                    if (attempt < 3) {
                        await new Promise(resolve => setTimeout(resolve, 2000)); 
                    }
                }
            }
            
            if (!json) {
                throw lastError || new Error('No se pudo conectar con la API');
            }

            if (!json.result || !json.result.format || json.result.format.length === 0) {
                throw new Error('No se pudo obtener información del video');
            }

            const videoInfo = json.result.format[0];
            const downloadUrl = videoInfo.download_url;
            const title = json.result.video_title || 'Video Pornhub';

            if (!downloadUrl) {
                throw new Error('No se encontró URL de descarga');
            }

            await sock.sendMessage(
                chatId,
                { video: { url: downloadUrl }, caption: `🎬 ${title}\n\n🔞 Contenido +18` },
                { quoted: msg }
            );

            await sock.sendMessage(chatId, {
                react: { text: '✅', key: msg.key }
            });

        } catch (error) {
            console.error('Error en comando pornhubdl:', error);
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });

            let errorMessage = '❌ Error al descargar el video.\n\n';
            if (error.code === 'ECONNRESET' || error.message?.includes('socket hang up')) {
                errorMessage += '⚠️ La API se desconectó inesperadamente.\n' +
                    '💡 Intenta de nuevo en unos segundos.';
            } else if (error.name === 'AbortError') {
                errorMessage += '⏱️ La descarga tardó demasiado.\n' +
                    '💡 El video puede ser muy pesado.';
            } else if (error.message?.includes('HTTP')) {
                errorMessage += '🌐 Error de conexión con la API.\n' +
                    '💡 El servicio puede estar caído temporalmente.';
            } else {
                errorMessage += `⚠️ ${error.message}\n\n` +
                    '💡 Verifica que el enlace sea válido.';
            }

            await sock.sendMessage(chatId, {
                text: errorMessage
            }, { quoted: msg });
        }
    }
};
