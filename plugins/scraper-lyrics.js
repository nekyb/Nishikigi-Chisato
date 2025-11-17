import axios from 'axios';

export default {
    name: 'lyrics',
    aliases: ['letra', 'letras', 'lyric'],
    category: 'scraper',
    description: 'Busca la letra de canciones',
    usage: '#lyrics [canción - artista]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Buscador de Letras* 🎵\n\n` +
                        `Uso: #lyrics [canción - artista]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #lyrics Bohemian Rhapsody - Queen\n` +
                        `✿ #lyrics Shape of You - Ed Sheeran\n` +
                        `✿ #letra Despacito - Luis Fonsi`
                });
            }

            const query = args.join(' ');
            let song, artist;
            if (query.includes('-')) {
                [song, artist] = query.split('-').map(s => s.trim());
            } else {
                song = query;
                artist = '';
            }

            const searchResponse = await axios.get(
                `https://api.lyrics.ovh/suggest/${encodeURIComponent(song + (artist ? ' ' + artist : ''))}`
            );

            if (!searchResponse.data || !searchResponse.data.data || searchResponse.data.data.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ No se encontró la canción.\n\n` +
                        `Intenta con otro nombre o formato:\n` +
                        `#lyrics [canción - artista]`
                });
            }

            const firstResult = searchResponse.data.data[0];
            const finalArtist = firstResult.artist.name;
            const finalSong = firstResult.title;
            const lyricsResponse = await axios.get(
                `https://api.lyrics.ovh/v1/${encodeURIComponent(finalArtist)}/${encodeURIComponent(finalSong)}`
            );

            if (!lyricsResponse.data || !lyricsResponse.data.lyrics) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》No se pudo obtener la letra de esta canción.`
                });
            }

            let lyrics = lyricsResponse.data.lyrics.trim();
            const maxLength = 4000;
            if (lyrics.length > maxLength) {
                const part1 = lyrics.substring(0, maxLength);
                const part2 = lyrics.substring(maxLength);
                await sock.sendMessage(chatId, {
                    text: `《✿》 *${finalSong}* 🎵\n` +
                        `🎤 ${finalArtist}\n\n` +
                        `━━━━━━━━━━━━━━━━━━\n\n` +
                        `${part1}\n\n` +
                        `_Parte 1/2_`
                }, { quoted: msg });
                await sock.sendMessage(chatId, {
                    text: `${part2}\n\n` +
                        `━━━━━━━━━━━━━━━━━━\n\n` +
                        `_Parte 2/2_\n` +
                        `> _*Powered By DeltaByte*_`
                });
            } else {
                let message = `《✿》 *${finalSong}* 🎵\n`;
                message += `🎤 ${finalArtist}\n\n`;
                if (firstResult.album?.title) {
                    message += `💿 Álbum: ${firstResult.album.title}\n`;
                }
                
                message += `━━━━━━━━━━━━━━━━━━\n\n`;
                message += `${lyrics}\n\n`;
                message += `━━━━━━━━━━━━━━━━━━\n\n`;
                message += `> *_Powered By DeltaByte_*`;
                if (firstResult.album?.cover_medium) {
                    await sock.sendMessage(chatId, {
                        image: { url: firstResult.album.cover_medium },
                        caption: message
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: message
                    }, { quoted: msg });
                }
            }
        } catch (error) {
            console.error('Error en lyrics:', error);
            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: `《✿》No se encontró la letra de esta canción.\n\n` +
                        `Verifica el nombre e intenta nuevamente.`
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✿》Error al buscar la letra.\n\n` +
                        `Intenta nuevamente en unos momentos.`
                });
            }
        }
    }
};
