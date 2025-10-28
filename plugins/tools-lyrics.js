import Genius from 'genius-lyrics';

const Client = new Genius.Client();
const lyricsCommand = {
    name: 'lyrics',
    aliases: ['letra', 'lyric', 'song'],
    category: 'utils',
    description: 'Busca información de canciones en Genius',
    usage: '#lyrics [nombre de la canción]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Buscador de Canciones - Genius* 《✧》\n\n` +
                        `Busca información sobre canciones y artistas.\n\n` +
                        `*Uso:*\n` +
                        `✿ #lyrics Bohemian Rhapsody Queen\n` +
                        `✿ #letra Shape of You Ed Sheeran\n` +
                        `✿ #song Blinding Lights\n\n` +
                        `💡 *Nota:* Te proporciono el enlace para ver la letra completa.`
                });
            }
            const query = args.join(' ');
            await sock.sendMessage(chatId, {
                text: '《✧》 🔍 Buscando canción en Genius...'
            });

            const searches = await Client.songs.search(query);
            if (!searches || searches.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No se encontró la canción\n\n' +
                        `Búsqueda: "${query}"\n\n` +
                        '💡 *Tip:* Intenta incluir el nombre del artista.'
                });
            }
            const song = searches[0];
            let artistInfo = '';
            try {
                artistInfo = song.artist?.name || 'Desconocido';
            }
            catch {
                artistInfo = 'Desconocido';
            }
            let releaseDate = 'Desconocida';
            try {
                if (song.releasedAt) {
                    releaseDate = new Date(song.releasedAt).toLocaleDateString();
                }
            }
            catch {
                releaseDate = 'Desconocida';
            }
            const response = `╔═══《 GENIUS SONG INFO 》═══╗\n` +
                `║\n` +
                `║ 🎵 *Canción:* ${song.title}\n` +
                `║ 🎤 *Artista:* ${artistInfo}\n` +
                `║ 📅 *Fecha:* ${releaseDate}\n` +
                `║\n` +
                `╚════════════════════╝\n\n` +
                `🔗 *Ver letra completa:*\n${song.url}\n\n` +
                `💡 *Nota:* Por derechos de autor, no puedo mostrar la letra aquí. Haz clic en el enlace para verla en Genius.com`;
            if (song.thumbnail || song.image) {
                try {
                    await sock.sendMessage(chatId, {
                        image: { url: song.thumbnail || song.image },
                        caption: response
                    }, { quoted: msg });
                }
                catch {
                    await sock.sendMessage(chatId, { text: response }, { quoted: msg });
                }
            }
            else {
                await sock.sendMessage(chatId, { text: response }, { quoted: msg });
            }
        }
        catch (error) {
            console.error('Error en lyrics:', error);
            let errorMessage = '《✧》 Error al buscar la canción\n\n';
            if (error.message?.includes('timeout')) {
                errorMessage += '⏱️ La búsqueda tardó demasiado.\nIntenta de nuevo.';
            }
            else if (error.message?.includes('network')) {
                errorMessage += '🌐 Error de conexión.\nVerifica tu internet.';
            }
            else {
                errorMessage += `💡 Error: ${error.message || 'Desconocido'}`;
            }
            await sock.sendMessage(chatId, { text: errorMessage });
        }
    }
};
export default lyricsCommand;