import { Spotify } from 'spotifydl-core';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const spotify = new Spotify({
    clientId: process.env.SPOTIFY_CLIENT_ID || '139a09c14feb4c87bbc683db40807a90',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '917f496c8ea448539178e3f42c4519cc'
});

const spotifyCommand = {
    name: 'getspotify',
    aliases: ['gs'],
    category: 'downloads',
    description: 'Descarga música de Spotify',
    usage: '#getspotify [URL de Spotify]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const tempDir = path.join(process.cwd(), 'temp');
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #getspotify https://open.spotify.com/track/xxx\n` +
                        `✿ #gs https://open.spotify.com/track/xxx`
                });
            }

            const url = args[0];
            const spotifyUrlRegex = /^https?:\/\/open\.spotify\.com\/track\/.+$/;
            const isValidUrl = spotifyUrlRegex.test(url);
            
            if (!isValidUrl) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor, proporciona una URL de Spotify válida.'
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 Descargando canción de Spotify...'
            });

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const trackInfo = await spotify.getTrack(url);
            
            const fileName = `${trackInfo.artists[0].name} - ${trackInfo.name}.mp3`
                .replace(/[<>:"/\\|?*]/g, '')
                .substring(0, 100);
            
            const filePath = path.join(tempDir, fileName);
            
            await spotify.downloadTrack(url, filePath);
            
            const artists = trackInfo.artists.map(a => a.name).join(', ');
            const duration = Math.floor(trackInfo.duration_ms / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            
            const caption = `《✧》 *Spotify Download*\n\n` +
                `✿ *Título:* ${trackInfo.name}\n` +
                `✿ *Artista:* ${artists}\n` +
                `✿ *Álbum:* ${trackInfo.album.name}\n` +
                `✿ *Duración:* ${minutes}:${seconds.toString().padStart(2, '0')}\n` +
                `✿ *Fecha:* ${trackInfo.album.release_date}\n\n` +
                `_Powered By DeltaByte_`;
            
            let coverBuffer = null;
            if (trackInfo.album.images && trackInfo.album.images.length > 0) {
                try {
                    const coverUrl = trackInfo.album.images[0].url;
                    const coverResponse = await axios.get(coverUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 10000 
                    });
                    coverBuffer = Buffer.from(coverResponse.data);
                } catch (coverError) {
                    console.log('No se pudo descargar la portada');
                }
            }
            
            await sock.sendMessage(chatId, {
                audio: fs.readFileSync(filePath),
                mimetype: 'audio/mpeg',
                fileName: fileName,
                contextInfo: {
                    externalAdReply: {
                        title: trackInfo.name,
                        body: artists,
                        thumbnail: coverBuffer,
                        mediaType: 1,
                        mediaUrl: url,
                        sourceUrl: url
                    }
                }
            }, { quoted: msg });
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
        } catch (error) {
            console.error('Error en comando getspotify:', error);
            let errorMessage = '《✧》 Error al procesar la solicitud de Spotify.';
            
            if (error.message?.includes('401') || error.message?.includes('credentials')) {
                errorMessage = '《✧》 Error de autenticación con Spotify. Verifica las credenciales del API.';
            } else if (error.message?.includes('404') || error.message?.includes('not found')) {
                errorMessage = '《✧》 La canción no existe o fue eliminada.';
            } else if (error.message?.includes('rate limit')) {
                errorMessage = '《✧》 Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
            } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
                errorMessage = '《✧》 Error de conexión. Intenta de nuevo.';
            }
            
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Asegúrate de que la URL sea correcta y la canción esté disponible.`
            });
        }
    }
};

export default spotifyCommand;