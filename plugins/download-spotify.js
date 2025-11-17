
import fetch from 'node-fetch';

const spotifyCommand = {
    name: 'getspotify',
    aliases: ['gs'],
    category: 'downloads',
    description: 'Descarga música de Spotify',
    usage: '#getspotify [nombre de la canción]',
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
                    text: `《✿》 *Uso incorrecto del comando*\n\n` +
                        `*Ejemplo:*\n` +
                        `✿ #getspotify ${random}`
                });
            }

            await sock.sendMessage(chatId, {
                react: { text: '⏱', key: msg.key }
            });

            const query = encodeURIComponent(args.join(' '));
            const searchUrl = `https://api.delirius.store/search/spotify?q=${query}`;
            const res = await fetch(searchUrl);
            const json = await res.json();
            if (!json.status || !json.data || json.data.length === 0) {
                await sock.sendMessage(chatId, {
                    react: { text: '❌', key: msg.key }
                });
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No encontré la canción que estás buscando.\n\n' +
                        '💡 *Tip:* Intenta con otro nombre o verifica la ortografía.'
                });
            }

            const track = json.data[0];
            if (!track || !track.url) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ⚠️ Resultado inválido de la API.'
                });
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 📥 Descargando audio...'
            });

            const downloadUrl = `https://api.delirius.store/download/spotifydl?url=${encodeURIComponent(track.url)}`;
            const dlRes = await fetch(downloadUrl);
            const dlJson = await dlRes.json();
            const audioUrl = dlJson?.data?.url;
            if (!audioUrl || audioUrl.includes('undefined')) {
                await sock.sendMessage(chatId, {
                    react: { text: '❌', key: msg.key }
                });
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ⚠️ Error al obtener el enlace de descarga.\n\n' +
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
                `╚═════════════════════╝`;

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
                react: { text: '✅', key: msg.key }
            });

        } catch (error) {
            console.error('Error en comando getspotify:', error);

            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });

            let errorMessage = '《✧》 ⚠️ Ocurrió un error al buscar o descargar la canción.';

            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La búsqueda tardó demasiado. Intenta de nuevo.';
            } else if (error.message?.includes('fetch')) {
                errorMessage = '《✧》 No se pudo conectar con el servicio de Spotify.';
            }

            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Verifica tu conexión e intenta de nuevo.`
            });
        }
    }
};

export default spotifyCommand;
