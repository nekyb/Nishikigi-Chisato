import axios from 'axios';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';

const playCommand = {
    name: 'play',
    aliases: ['yta', 'ytmp3', 'play2', 'ytv', 'ytmp4', 'playaudio', 'mp4'],
    category: 'downloads',
    description: 'Descarga audio o video de YouTube',
    usage: '#play [búsqueda o URL]',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;
        const command = msg.body.split(' ')[0].substring(1).toLowerCase();
        const text = args.join(' ');

        try {
            if (!text?.trim()) {
                return await sock.sendMessage(chatId, {
                    text: t(userId, 'downloads.missing_query')
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, { react: { text: '🕒', key: msg.key } });

            // Buscar en YouTube
            const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);
            const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text;
            const search = await yts(query);
            const result = videoMatch 
                ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] 
                : search.all[0];

            if (!result) {
                throw new Error(t(userId, 'downloads.no_results'));
            }

            const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result;

            // Verificar límite de duración
            const maxDuration = 1800; // 30 minutos
            if (seconds > maxDuration) {
                throw new Error(t(userId, 'downloads.too_long', { max: Math.floor(maxDuration / 60) }));
            }

            // Formatear información del video
            const vistas = formatViews(views);
            const info = t(userId, 'downloads.video_info', {
                title: title,
                channel: author.name,
                views: vistas,
                duration: timestamp,
                published: ago,
                url: url
            });

            // Obtener thumbnail
            const { data: thumb } = await axios.get(thumbnail, { 
                responseType: 'arraybuffer',
                timeout: 10000
            });

            // Enviar mensaje con miniatura
            await sock.sendMessage(chatId, { 
                image: thumb, 
                caption: info 
            }, { quoted: msg });

            // ───────────────────────────────
            // Descargar audio o video
            // ───────────────────────────────
            if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {
                const audio = await fetchYouTubeLink(url, 'audio');
                if (!audio?.url) {
                    throw new Error(t(userId, 'downloads.audio_failed'));
                }

                await sock.sendMessage(chatId, {
                    text: t(userId, 'downloads.processing_audio', { server: audio.api })
                }, { quoted: msg });

                await sock.sendMessage(chatId, { 
                    audio: { url: audio.url }, 
                    fileName: `${title}.mp3`, 
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });

                await sock.sendMessage(chatId, { react: { text: '✔️', key: msg.key } });

            } else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {
                const video = await fetchYouTubeLink(url, 'video');
                if (!video?.url) {
                    throw new Error(t(userId, 'downloads.video_failed'));
                }

                await sock.sendMessage(chatId, {
                    text: t(userId, 'downloads.processing_video', { server: video.api })
                }, { quoted: msg });

                // Enviar video como documento para evitar compresión y visualización única
                await sock.sendMessage(chatId, {
                    document: { url: video.url },
                    mimetype: 'video/mp4',
                    fileName: `${title}.mp4`,
                    caption: `🎬 ${title}`
                }, { quoted: msg });

                await sock.sendMessage(chatId, { react: { text: '✔️', key: msg.key } });
            }

        } catch (e) {
            await sock.sendMessage(chatId, { react: { text: '✖️', key: msg.key } });
            const errorMessage = e instanceof Error ? e.message : String(e);

            const errorText = t(userId, 'downloads.error_generic', {
                prefix: '#',
                error: errorMessage
            });

            return await sock.sendMessage(chatId, {
                text: errorText
            }, { quoted: msg });
        }
    }
};

export default playCommand;

// ──────────────────────────────
// FUNCIONES AUXILIARES
// ──────────────────────────────

/**
 * Busca enlace de descarga entre las APIs registradas globalmente.
 */
async function fetchYouTubeLink(url, type) {
    const endpoints = {
        audio: [
            '/downloader/ytmp3?url=',
            '/downloader/ytmp3v2?url=',
            '/api/downloader/ytmp3?url=',
            '/download/youtubemp3?url='
        ],
        video: [
            '/downloader/ytmp4?url=',
            '/downloader/ytmp4v2?url=',
            '/api/downloader/ytmp4?url=',
            '/download/youtubemp4?url='
        ]
    };

    for (const apiName in global.APIs) {
        const api = global.APIs[apiName];
        if (!api?.url) continue;

        for (const endpoint of endpoints[type]) {
            const fullUrl = `${api.url}${endpoint}${encodeURIComponent(url)}`;

            try {
                const response = await axios.get(fullUrl, { 
                    timeout: 15000,
                    validateStatus: (status) => status < 500
                });
                const data = response.data;
                const link = data?.result?.url 
                    || data?.result?.link 
                    || data?.download_url 
                    || data?.result?.download_url 
                    || data?.result?.download;

                if (link) {
                    console.log(`✅ Enlace obtenido de la API: ${apiName}`);
                    return { url: link, api: apiName };
                }
            } catch (e) {
                console.log(`❌ API ${apiName} con endpoint ${endpoint} falló: ${e.message}`);
                continue;
            }
        }
    }

    return null;
}

/**
 * Formatea vistas en formato legible.
 */
function formatViews(views) {
    if (views === undefined) return "No disponible";
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`;
    return views.toLocaleString();
}