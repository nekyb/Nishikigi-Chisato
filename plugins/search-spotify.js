import axios from 'axios';
const spotifyCommand = {
    name: 'spotify',
    aliases: ['sp', 'spotifydl'],
    category: 'downloads',
    description: 'Busca y descarga canciones de Spotify',
    usage: '#spotify [nombre de la canción]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                const ejemplos = [
                    'Adele Hello',
                    'Sia Unstoppable',
                    'Maroon 5 Memories',
                    'Karol G Provenza',
                    'Natalia Jiménez Creo en mí'
                ];
                const random = ejemplos[Math.floor(Math.random() * ejemplos.length)];
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #spotify ${random}`
                });
            }
            const query = args.join(' ');
            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando canción en Spotify...'
            });

            const searchUrl = `https://api.delirius.store/search/spotify?q=${encodeURIComponent(query)}`;
            const searchResponse = await axios.get(searchUrl, {
                timeout: 20000
            });
            const json = searchResponse.data;
            if (!json.status || !json.data || json.data.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No encontré la canción que estás buscando.\n\n' +
                        '💡 *Tip:* Intenta con el nombre del artista y la canción.'
                });
            }
            const track = json.data[0];
            if (!track || !track.url) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Resultado inválido de la búsqueda.'
                });
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 Canción encontrada. Descargando audio...'
            });

            const downloadUrl = `https://api.delirius.store/download/spotifydl?url=${encodeURIComponent(track.url)}`;
            const downloadResponse = await axios.get(downloadUrl, {
                timeout: 30000
            });
            const audioUrl = downloadResponse.data?.data?.url;
            if (!audioUrl || audioUrl.includes('undefined')) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al obtener el enlace de descarga.\n\n' +
                        '💡 *Tip:* Intenta con otra canción o espera unos momentos.'
                });
            }
            const caption = `╔═══《 SPOTIFY 》═══╗\n` +
                `║\n` +
                `║ ✦ *Título:* ${track.title}\n` +
                `║ ✦ *Artista:* ${track.artist}\n` +
                `║ ✦ *Álbum:* ${track.album}\n` +
                `║ ✦ *Duración:* ${track.duration}\n` +
                `║ ✦ *Popularidad:* ${track.popularity}\n` +
                `║ ✦ *Publicado:* ${track.publish}\n` +
                `║ ✦ *Link:* ${track.url}\n` +
                `║\n` +
                `╚═════════════════╝`;
            await sock.sendMessage(chatId, {
                image: { url: track.image },
                caption: caption
            }, { quoted: msg });
            await sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${track.title}.mp3`
            }, { quoted: msg });
            await sock.sendMessage(chatId, {
                text: `《✧》 ✅ *Descarga completada*\n\n✿ Canción: ${track.title}`
            });
        }
        catch (error) {
            console.error('Error en comando spotify:', error);
            let errorMessage = '《✧》 Error al buscar o descargar la canción.';
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La búsqueda tardó demasiado. Intenta de nuevo.';
            }
            else if (error.response?.status === 404) {
                errorMessage = '《✧》 No se encontró la canción en Spotify.';
            }
            else if (error.response?.status === 400) {
                errorMessage = '《✧》 Búsqueda inválida. Intenta con otros términos.';
            }
            else if (error.response?.status === 429) {
                errorMessage = '《✧》 Demasiadas solicitudes. Espera unos momentos.';
            }
            else if (!error.response) {
                errorMessage = '《✧》 No se pudo conectar con el servicio de Spotify.';
            }
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Intenta buscar con el nombre completo de la canción y el artista.`
            });
        }
    }
};
export default spotifyCommand;