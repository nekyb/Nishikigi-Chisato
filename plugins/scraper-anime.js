import axios from 'axios';

export default {
    name: 'anime',
    aliases: ['animeinfo', 'animedata'],
    category: 'scraper',
    description: 'Busca información detallada de anime',
    usage: '#anime [nombre]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Buscador de Anime* 🎌\n\n` +
                        `Uso: #anime [nombre]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #anime Naruto\n` +
                        `✿ #anime One Piece\n` +
                        `✿ #anime Attack on Titan`
                });
            }

            const query = args.join(' ');
            const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
            const data = response.data.data;
            if (!data || data.length === 0) {
                await m.react('❌');
                return await sock.sendMessage(chatId, {
                    text: `《✿》No se encontró el anime "${query}".\n\nIntenta con otro nombre.`
                });
            }

            const anime = data[0];
            const statusEmoji = {
                'Currently Airing': '📡',
                'Finished Airing': '✅',
                'Not yet aired': '⏳'
            };

            const ratingColor = anime.score >= 8.0 ? '⭐' : 
                              anime.score >= 6.0 ? '🌟' : '⚡';
            const genres = anime.genres?.map(g => g.name).join(', ') || 'N/A';
            const studios = anime.studios?.map(s => s.name).join(', ') || 'N/A';
            const aired = anime.aired?.string || 'N/A';
            let caption = `《✿》 *${anime.title}* 🎌\n\n`;
            if (anime.title_japanese) {
                caption += `🇯🇵 *Título JP:* ${anime.title_japanese}\n`;
            }
            
            caption += `${statusEmoji[anime.status] || '📺'} *Estado:* ${anime.status}\n` +
                `${ratingColor} *Puntuación:* ${anime.score || 'N/A'}/10\n` +
                `✦ *Popularidad:* #${anime.popularity || 'N/A'}\n` +
                `✦ *Miembros:* ${anime.members?.toLocaleString() || 'N/A'}\n\n` +
                `✦ *Tipo:* ${anime.type || 'N/A'}\n` +
                `✦ *Episodios:* ${anime.episodes || 'N/A'}\n` +
                `✦ *Duración:* ${anime.duration || 'N/A'}\n` +
                `✦ *Géneros:* ${genres}\n` +
                `✦ *Estudios:* ${studios}\n` +
                `✦ *Emisión:* ${aired}\n` +
                `✦ *Rating:* ${anime.rating || 'N/A'}\n\n` +
                `✦ *Sinopsis:*\n${anime.synopsis ? anime.synopsis.slice(0, 300) + '...' : 'N/A'}\n\n` +
                `✦ *MyAnimeList:* ${anime.url}\n\n` +
                `_Datos de Jikan API (MyAnimeList)_`;

            if (anime.images?.jpg?.large_image_url) {
                await sock.sendMessage(chatId, {
                    image: { url: anime.images.jpg.large_image_url },
                    caption: caption
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: caption
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error en anime:', error);
            if (error.response?.status === 429) {
                await sock.sendMessage(chatId, {
                    text: `《✿》Demasiadas consultas.\n\nEspera unos segundos e intenta de nuevo.`
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✿》Error al buscar el anime.\n\n` +
                        `Verifica el nombre e intenta nuevamente.`
                });
            }
        }
    }
};
