import axios from 'axios';

export default {
    name: 'movie',
    aliases: ['pelicula', 'film', 'serie'],
    category: 'scraper',
    description: 'Busca información detallada de películas y series',
    usage: '#movie [nombre]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Buscador de Películas y Series* 🎬\n\n` +
                        `Uso: #movie [nombre]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #movie Inception\n` +
                        `✿ #movie Breaking Bad\n` +
                        `✿ #pelicula Avatar`
                });
            }

            const query = args.join(' ');
            const response = await axios.get(`https://www.omdbapi.com/?apikey=trilogy&t=${encodeURIComponent(query)}`);
            const data = response.data;
            if (data.Response === 'False') {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ No se encontró "${query}".\n\nIntenta con otro nombre.`
                });
            }

            const typeEmoji = {
                'movie': '🎬',
                'series': '📺',
                'game': '🎮'
            };

            const emoji = typeEmoji[data.Type] || '🎬';
            const ratingColor = parseFloat(data.imdbRating) >= 7.0 ? '⭐' : 
                              parseFloat(data.imdbRating) >= 5.0 ? '🌟' : '⚡';
            let message = `《✧》 *${data.Title}* ${emoji}\n\n`;
            if (data.Poster && data.Poster !== 'N/A') {
                await sock.sendMessage(chatId, {
                    image: { url: data.Poster },
                    caption: message +
                        `✦ *Año:* ${data.Year}\n` +
                        `${ratingColor} *Rating:* ${data.imdbRating}/10\n` +
                        `✦ *Género:* ${data.Genre}\n` +
                        `✦ *Duración:* ${data.Runtime}\n` +
                        `✦ *Director:* ${data.Director}\n` +
                        `✦ *Actores:* ${data.Actors}\n\n` +
                        `✦ *Sinopsis:*\n${data.Plot}\n\n` +
                        `✦ *Premios:* ${data.Awards}\n` +
                        `✦ *País:* ${data.Country}\n` +
                        `✦ *Idioma:* ${data.Language}\n` +
                        `✦ *Votos:* ${data.imdbVotes}\n\n` +
                        `${data.BoxOffice !== 'N/A' ? `💰 *Box Office:* ${data.BoxOffice}\n` : ''}` +
                        `\n_Datos de OMDB API_`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: message +
                        `✦ *Año:* ${data.Year}\n` +
                        `${ratingColor} *Rating:* ${data.imdbRating}/10\n` +
                        `✦ *Género:* ${data.Genre}\n` +
                        `✦ *Duración:* ${data.Runtime}\n` +
                        `✦ *Director:* ${data.Director}\n` +
                        `✦ *Actores:* ${data.Actors}\n\n` +
                        `✦ *Sinopsis:*\n${data.Plot}\n\n` +
                        `✦ *Premios:* ${data.Awards}\n` +
                        `✦ *País:* ${data.Country}\n` +
                        `✦ *Idioma:* ${data.Language}\n` +
                        `✦ *Votos:* ${data.imdbVotes}\n\n` +
                        `${data.BoxOffice !== 'N/A' ? `✦ *Box Office:* ${data.BoxOffice}\n` : ''}` +
                        `\n_Datos de OMDB API_`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error en movie:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al buscar la película/serie.\n\n` +
                    `Verifica el nombre e intenta nuevamente.`
            });
        }
    }
};
