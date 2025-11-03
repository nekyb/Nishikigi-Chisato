import * as findLyricsModule from '@brandond/findthelyrics';
const findLyrics = findLyricsModule.default || findLyricsModule;

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
                    text: `《✧》 *Buscador de Letras*\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #lyrics Queen Bohemian Rhapsody\n` +
                        `✿ #letra Ed Sheeran Shape of You\n` +
                        `✿ #song The Weeknd Blinding Lights\n\n` +
                        `💡 Formato: artista + canción`
                });
                return
            }

            const query = args.join(' ');
            let artist = '';
            let title = '';
            
            if (args.length >= 2) {
                const midPoint = Math.floor(args.length / 2);
                artist = args.slice(0, midPoint).join(' ');
                title = args.slice(midPoint).join(' ');
            } else {
                title = query;
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando letra de la canción...'
            });
            
            let result;
            try {
                if (typeof findLyrics === 'function') {
                    result = await findLyrics(artist, title);
                } else if (typeof findLyricsModule === 'function') {
                    result = await findLyricsModule(artist, title);
                } else {
                    throw new Error('Módulo de letras no disponible');
                }
            } catch (moduleError) {
                console.error('Error con el módulo findLyrics:', moduleError);
                await sock.sendMessage(chatId, {
                    text: `《✧》 El servicio de letras no está disponible temporalmente.\n\n` +
                        `💡 *Alternativas:*\n` +
                        `✿ Busca en Genius.com\n` +
                        `✿ Intenta más tarde`
                }, { quoted: msg });
                return
            }

            if (!result || !result.lyrics) {
                await sock.sendMessage(chatId, {
                    text: `《✧》 No se encontró la letra de "${query}"\n\n` +
                        `💡 *Tips:*\n` +
                        `✿ Usa el formato: artista canción\n` +
                        `✿ Ejemplo: #lyrics Queen Bohemian Rhapsody\n` +
                        `✿ Verifica la ortografía\n` +
                        `✿ Intenta con el título en inglés`
                }, { quoted: msg });
                return
            }

            const lyricsText = result.lyrics.trim();
            const maxLength = 4000;
            
            if (lyricsText.length <= maxLength) {
                const header = `《✧》 *Letra de Canción*\n\n` +
                    `🎵 *Canción:* ${result.title || title}\n` +
                    `🎤 *Artista:* ${result.artist || artist}\n` +
                    `🌐 *Fuente:* ${result.source || 'Web'}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━\n\n`;

                await sock.sendMessage(chatId, {
                    text: header + lyricsText + `\n\n_Powered By DeltaByte_`
                }, { quoted: msg });
            } else {
                const fragments = [];
                const lyricsLines = lyricsText.split('\n');
                let currentFragment = '';

                for (const line of lyricsLines) {
                    if ((currentFragment + line + '\n').length > maxLength) {
                        fragments.push(currentFragment.trim());
                        currentFragment = line + '\n';
                    } else {
                        currentFragment += line + '\n';
                    }
                }
                
                if (currentFragment.trim()) {
                    fragments.push(currentFragment.trim());
                }

                const header = `《✧》 *Letra de Canción*\n\n` +
                    `✩ *Canción:* ${result.title || title}\n` +
                    `✩ *Artista:* ${result.artist || artist}\n` +
                    `✩ *Fuente:* ${result.source || 'Web'}\n` +
                    `✩ *Partes:* ${fragments.length}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━\n\n`;

                await sock.sendMessage(chatId, {
                    text: header + `*Parte 1 de ${fragments.length}*\n\n` + fragments[0]
                }, { quoted: msg });

                for (let i = 1; i < fragments.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    await sock.sendMessage(chatId, {
                        text: `《✧》 *Parte ${i + 1} de ${fragments.length}*\n\n` + fragments[i] + `\n\n_Powered By DeltaByte_`
                    });
                }
            }

        } catch (error) {
            console.error('Error en comando lyrics:', error);
            let errorMessage = '《✧》 Error al buscar la letra.';
            
            if (error.message?.includes('timeout')) {
                errorMessage = '《✧》 La búsqueda tardó demasiado. Intenta de nuevo.';
            } else if (error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
                errorMessage = '《✧》 Error de conexión. Verifica tu internet.';
            } else if (error.message?.includes('not found')) {
                errorMessage = '《✧》 No se encontró la canción. Verifica el nombre del artista y canción.';
            }
            
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Intenta con el formato: artista canción`
            });
        }
    }
};

export default lyricsCommand;