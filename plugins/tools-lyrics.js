import axios from 'axios';

const lyricsCommand = {
    name: 'lyrics',
    aliases: ['letra', 'lyric', 'song'],
    category: 'utils',
    description: 'Busca letras de canciones',
    usage: '#lyrics <artista> <canción>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `《✿》 *Buscador de Letras*\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #lyrics TWICE 21:29\n` +
                        `✿ #letra Ed Sheeran Shape of You\n` +
                        `✿ #song The Weeknd Blinding Lights\n\n` +
                        `💡 Formato: artista + canción`
                });
                return;
            }

            const query = args.join(' ');

            await sock.sendMessage(chatId, {
                text: '《✿》 🔍 Buscando letra de la canción...'
            });
            
            // Buscar en API Delirius
            const response = await axios.get(
                `https://api.delirius.store/search/lyrics?query=${encodeURIComponent(query)}`,
                {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );

            // Verificar estructura de respuesta
            if (!response.data || !response.data.status || !response.data.data) {
                await sock.sendMessage(chatId, {
                    text: `《✿》 ❌ No se encontró la letra de "${query}"\n\n` +
                        `💡 *Tips:*\n` +
                        `✿ Verifica la ortografía\n` +
                        `✿ Usa el formato: artista canción\n` +
                        `✿ Ejemplo: #lyrics TWICE 21:29\n` +
                        `✿ Intenta con el título en inglés`
                }, { quoted: msg });
                return;
            }

            const result = response.data.data;
            
            // Verificar que exista la letra
            if (!result.lyrics || result.lyrics.trim().length === 0) {
                await sock.sendMessage(chatId, {
                    text: `《✿》 ❌ No se encontró la letra completa de "${query}"\n\n` +
                        `💡 Intenta con otro término de búsqueda`
                }, { quoted: msg });
                return;
            }

            const cleanLyrics = result.lyrics.trim();
            const maxLength = 4000;
            
            // Información de la canción
            const songInfo = {
                title: result.title || 'Desconocido',
                artist: result.artists || 'Desconocido',
                album: result.album || 'N/A',
                duration: result.duration || 'N/A'
            };

            // Si la letra cabe en un solo mensaje
            if (cleanLyrics.length <= maxLength) {
                const header = `《✿》 *Letra de Canción* 《✿》\n\n` +
                    `🎵 *Título:* ${songInfo.title}\n` +
                    `🎤 *Artista:* ${songInfo.artist}\n` +
                    `💿 *Álbum:* ${songInfo.album}\n` +
                    `⏱️ *Duración:* ${songInfo.duration}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━\n\n`;

                await sock.sendMessage(chatId, {
                    text: header + cleanLyrics + `\n\n━━━━━━━━━━━━━━━━━━━\n_Powered by Delirius API_`
                }, { quoted: msg });
            } else {
                // Dividir en fragmentos si es muy larga
                const fragments = [];
                const lyricsLines = cleanLyrics.split('\n');
                let currentFragment = '';
                
                for (const line of lyricsLines) {
                    if ((currentFragment + line + '\n').length > maxLength) {
                        if (currentFragment.trim()) {
                            fragments.push(currentFragment.trim());
                        }
                        currentFragment = line + '\n';
                    } else {
                        currentFragment += line + '\n';
                    }
                }
                
                if (currentFragment.trim()) {
                    fragments.push(currentFragment.trim());
                }

                // Enviar primera parte con información
                const header = `《✿》 *Letra de Canción* 《✿》\n\n` +
                    `🎵 *Título:* ${songInfo.title}\n` +
                    `🎤 *Artista:* ${songInfo.artist}\n` +
                    `💿 *Álbum:* ${songInfo.album}\n` +
                    `⏱️ *Duración:* ${songInfo.duration}\n` +
                    `📄 *Partes:* ${fragments.length}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━\n\n`;

                await sock.sendMessage(chatId, {
                    text: header + `*[Parte 1/${fragments.length}]*\n\n` + fragments[0]
                }, { quoted: msg });

                // Enviar partes restantes
                for (let i = 1; i < fragments.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const isLast = i === fragments.length - 1;
                    const footer = isLast ? '\n\n━━━━━━━━━━━━━━━━━━━\n_Powered by Delirius API_' : '';
                    
                    await sock.sendMessage(chatId, {
                        text: `《✿》 *[Parte ${i + 1}/${fragments.length}]*\n\n` + fragments[i] + footer
                    });
                }
            }

        } catch (error) {
            console.error('Error en comando lyrics:', error);
            
            let errorMessage = '《✿》 ❌ Error al buscar la letra\n\n';
            
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage += '⏱️ *Timeout:* La búsqueda tardó demasiado.\n';
                errorMessage += '💡 Intenta de nuevo en unos segundos.';
            } else if (error.response?.status === 404) {
                errorMessage += '🔍 *No encontrado:* No se encontró la canción.\n';
                errorMessage += '💡 Verifica el nombre del artista y la canción.';
            } else if (error.response?.status === 500) {
                errorMessage += '🚫 *Error del servidor:* El servicio no está disponible.\n';
                errorMessage += '💡 Intenta más tarde.';
            } else if (error.message?.includes('ENOTFOUND')) {
                errorMessage += '🌐 *Sin conexión:* No se puede conectar con la API.\n';
                errorMessage += '💡 Verifica tu conexión a internet.';
            } else {
                errorMessage += `⚠️ *Error:* ${error.message || 'Desconocido'}\n\n`;
                errorMessage += '💡 Usa el formato: #lyrics artista canción';
            }
            
            await sock.sendMessage(chatId, {
                text: errorMessage
            });
        }
    }
};

export default lyricsCommand;