// Plugin para identificar música usando ACRCloud
// Adaptado para Nishikigi Chisato Bot

import fs from 'fs';
import path from 'path';
import acrcloud from 'acrcloud';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execPromise = promisify(exec);
const acr = new acrcloud({
    host: 'identify-eu-west-1.acrcloud.com',
    access_key: 'c33c767d683f78bd17d4bd4991955d81',
    access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu'
});

const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

async function convertToMp3(inputPath, outputPath) {
    try {
        const isWindows = process.platform === 'win32';
        const ffmpegCmd = isWindows ? 'ffmpeg' : 'ffmpeg';
        const command = `${ffmpegCmd} -i "${inputPath}" -q:a 5 -ac 2 -ar 44100 "${outputPath}" -y`;
        await execPromise(command);
        return true;
    } catch (error) {
        console.error('Error al convertir a MP3:', error.message);
        return false;
    }
}

export default {
    name: 'quemusica',
    aliases: ['quemusicaes', 'whatmusic', 'identify-music'],
    category: 'tools',
    description: 'Identifica la canción de un audio o video',
    usage: '#quemusica [responder a audio/video]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        try {
            if (!quotedMsg) {
                return await sock.sendMessage(chatId, {
                    text: '💭 Por favor responde a un audio o video para identificar la canción.'
                }, { quoted: msg });
            }

            const audioMessage = quotedMsg?.audioMessage;
            const videoMessage = quotedMsg?.videoMessage;
            if (!audioMessage && !videoMessage) {
                return await sock.sendMessage(chatId, {
                    text: '💭 Por favor responde a un audio o video para identificar la canción.'
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, {
                text: '🎵 Identificando canción... Por favor espera.'
            }, { quoted: msg });
            let mediaUrl = audioMessage?.url || videoMessage?.url;
            let mimeType = audioMessage?.mimetype || videoMessage?.mimetype || 'audio/mpeg';
            if (!mediaUrl) {
                throw new Error('No se puede acceder a la URL de la media. Intenta con otro archivo.');
            }

            console.log(`📥 Descargando ${audioMessage ? 'audio' : 'video'}: ${mediaUrl.substring(0, 100)}...`);
            let media;
            try {
                const response = await axios.get(mediaUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                media = Buffer.from(response.data);
            } catch (downloadError) {
                console.error('Error descargando media:', downloadError.message);
                throw new Error(`Error descargando: ${downloadError.message}`);
            }

            if (!media || media.length === 0) {
                throw new Error('El archivo descargado está vacío.');
            }

            console.log(`✅ Media descargada: ${media.length} bytes`);
            const ext = mimeType.split('/')[1]?.split(';')[0] || 'mp3';
            const fileName = `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
            const filePath = path.join(tmpDir, fileName);
            fs.writeFileSync(filePath, media);
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                fs.unlinkSync(filePath);
                throw new Error('El archivo guardado está vacío.');
            }

            console.log(`📁 Archivo guardado: ${filePath} (${stats.size} bytes)`);
            let audioPath = filePath;
            if (ext !== 'mp3') {
                const mp3Path = filePath.replace(`.${ext}`, '.mp3');
                console.log(`🔄 Convirtiendo a MP3: ${mp3Path}`);
                const converted = await convertToMp3(filePath, mp3Path);
                if (converted && fs.existsSync(mp3Path)) {
                    fs.unlinkSync(filePath); 
                    audioPath = mp3Path;
                    console.log(`✅ Convertido a MP3: ${mp3Path} (${fs.statSync(mp3Path).size} bytes)`);
                } else {
                    console.warn('⚠️ No se pudo convertir a MP3, intentando con el archivo original...');
                }
            }

            let res;
            try {
                const fileBuffer = fs.readFileSync(audioPath);
                console.log(`🎵 Buffer para ACRCloud: ${fileBuffer.length} bytes`);
                res = await acr.identify(fileBuffer);
            } catch (acrError) {
                fs.unlinkSync(audioPath);
                console.error('Error en ACRCloud:', acrError.message);
                throw new Error(`ACRCloud: ${acrError.message}`);
            }
  
            try {
                fs.unlinkSync(audioPath);
            } catch (unlinkError) {
                console.warn(`Advertencia al eliminar archivo: ${unlinkError.message}`);
            }

            const { code, msg: statusMsg } = res.status || { code: -1, msg: 'Error desconocido' };
            if (code !== 0) {
                throw new Error(statusMsg || 'No se pudo identificar la canción. Intenta con un archivo más claro.');
            }

            const info = res.metadata?.music?.[0];
            if (!info) {
                throw new Error('No se encontró información de la canción en la base de datos.');
            }

            const title = info.title || 'No encontrado';
            const artists = info.artists ? info.artists.map(v => v.name).join(', ') : 'No encontrado';
            const album = info.album?.name || 'No encontrado';
            const genres = info.genres ? info.genres.map(v => v.name).join(', ') : 'No encontrado';
            const releaseDate = info.release_date || 'No encontrado';
            const duration = info.duration_ms ? `${Math.floor(info.duration_ms / 1000)}s` : 'No encontrado';
            const score = Math.round((info.score || 0) * 100);
            const responseText = `
《✿》 *IDENTIFICACIÓN DE CANCIÓN*

🌻 *Título:* ${title}
🍃 *Artista:* ${artists}
💻 *Álbum:* ${album}
🍂 *Género:* ${genres}
⏱️ *Duración:* ${duration}
🪙 *Fecha de Lanzamiento:* ${releaseDate}
🎯 *Precisión:* ${score}%

─────────────────────
_Identificado con ACRCloud_
`.trim();

            await sock.sendMessage(chatId, {
                text: responseText
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ Error identificando música:', error.message);
            try {
                const files = fs.readdirSync(tmpDir);
                const now = Date.now();
                files.forEach(file => {
                    const filePath = path.join(tmpDir, file);
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtimeMs > 5 * 60 * 1000) {
                        fs.unlinkSync(filePath);
                    }
                });
            } catch (cleanupError) {
                console.warn('Error limpiando archivos:', cleanupError.message);
            }

            await sock.sendMessage(chatId, {
                text: `❌ Error al identificar la canción:\n\n${error.message}\n\n_Verifica que el audio sea claro y reconocible._`
            }, { quoted: msg });
        }
    }
};
