import axios from 'axios'
import FormData from 'form-data'
import pkg from '@soblend/baileys';
const { downloadMediaMessage } = pkg;

const shazamCommand = {
    name: 'shazam',
    aliases: ['identificar', 'song', 'whatsong', 'quecanciones'],
    category: 'music',
    description: 'Identifica canciones desde audio o video',
    usage: '#shazam [responde a un audio/video o envía con caption]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
            const audioMessage = msg.message?.audioMessage || 
                                quotedMsg?.audioMessage || 
                                msg.message?.videoMessage || 
                                quotedMsg?.videoMessage
            if (!audioMessage) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Shazam - Identificador de Música* 《✧》\n\n` +
                        `🎵 Identifica cualquier canción al instante.\n\n` +
                        `*Uso:*\n` +
                        `✿ Envía un audio con el caption: #shazam\n` +
                        `✿ Responde a un audio/video con: #shazam\n` +
                        `✿ Envía una nota de voz: #shazam\n\n` +
                        `💡 *Tip:* El audio debe tener al menos 3-5 segundos para mejor precisión.`
                })
            }

            const buffer = await downloadMediaMessage(
                quotedMsg || msg,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            console.log('Audio descargado:', buffer.length, 'bytes')
            const songData = await identifySong(buffer)
            if (!songData || !songData.track) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No se pudo identificar la canción\n\n' +
                        '💡 *Posibles razones:*\n' +
                        '• El audio es muy corto (mínimo 3-5 segundos)\n' +
                        '• Mucho ruido de fondo\n' +
                        '• Canción muy nueva o poco conocida\n' +
                        '• Audio de baja calidad\n\n' +
                        '🔄 Intenta con un audio más claro o más largo.'
                })
            }

            const track = songData.track
            let response = `╔═══《 🎵 SHAZAM 》═══╗\n` +
                `║\n` +
                `║ 🎵 *Canción:* ${track.title || 'Desconocido'}\n` +
                `║ 🎤 *Artista:* ${track.subtitle || 'Desconocido'}\n`
            if (track.sections) {
                for (const section of track.sections) {
                    if (section.type === 'SONG' && section.metadata) {
                        const metadata = section.metadata
                        if (metadata.find(m => m.title === 'Album')) {
                            const album = metadata.find(m => m.title === 'Album').text
                            response += `║ 💿 *Álbum:* ${album}\n`;
                        }
                        
                        if (metadata.find(m => m.title === 'Released')) {
                            const year = metadata.find(m => m.title === 'Released').text
                            response += `║ 📅 *Año:* ${year}\n`;
                        }
                        
                        if (metadata.find(m => m.title === 'Genre')) {
                            const genre = metadata.find(m => m.title === 'Genre').text
                            response += `║ 🎸 *Género:* ${genre}\n`
                        }
                    }
                }
            }

            response += `║\n╚════════════════════╝\n\n`
            if (track.hub?.actions) {
                response += `🎧 *Escuchar en:*\n`;
                for (const action of track.hub.actions) {
                    if (action.type === 'uri' && action.uri) {
                        const platform = action.name || 'Link';
                        response += `• ${platform}: ${action.uri}\n`
                    }
                }
                response += '\n'
            }

            if (track.url) {
                response += `🔗 *Ver en Shazam:*\n${track.url}\n\n`
            }

            if (track.sections) {
                const lyricsSection = track.sections.find(s => s.type === 'LYRICS')
                if (lyricsSection && lyricsSection.text) {
                    const lyrics = lyricsSection.text.join('\n')
                    if (lyrics.length < 500) {
                        response += `📝 *Letra (preview):*\n${lyrics.substring(0, 300)}...\n\n`
                    }
                }
            }

            response += `✨ Identificado por Shazam`
            if (track.images?.coverart || track.images?.background) {
                try { await sock.sendMessage(chatId, {
                        image: { url: track.images.coverart || track.images.background },
                        caption: response
                    }, { quoted: msg })
                } catch {
                    await sock.sendMessage(chatId, { text: response }, { quoted: msg })
                }
            } else {
                await sock.sendMessage(chatId, { text: response }, { quoted: msg })
            }
        } catch (error) {
            console.error('Error en shazam:', error)
            let errorMessage = '《✧》 ❌ Error al identificar la canción\n\n'
            if (error.message?.includes('timeout')) {
                errorMessage += '⏱️ La identificación tardó demasiado.\n' +
                    '💡 Intenta con un audio más corto.'
            } else if (error.message?.includes('network') || error.code === 'ENOTFOUND') {
                errorMessage += '🌐 Error de conexión.\n' +
                    '💡 Verifica tu internet e intenta de nuevo.'
            } else if (error.response?.status === 401) {
                errorMessage += '🔑 Error de autenticación con Shazam API.\n' +
                    '💡 Verifica la configuración de la API key.'
            } else if (error.response?.status === 429) {
                errorMessage += '⚠️ Límite de peticiones alcanzado.\n' +
                    '💡 Intenta de nuevo en unos minutos.'
            } else {
                errorMessage += `💡 Error: ${error.message || 'Desconocido'}\n\n` +
                    `📝 Asegúrate de:\n` +
                    `• Enviar un audio claro\n` +
                    `• Audio de al menos 3-5 segundos\n` +
                    `• Buena calidad de audio`;
            }
            
            await sock.sendMessage(chatId, { text: errorMessage })
        }
    }
};

async function identifySong(audioBuffer) {
    try {
        const formData = new FormData();
        formData.append('file', audioBuffer, {
            filename: 'audio.mp3',
            contentType: 'audio/mpeg'
        })

        const response = await axios.post(
            'https://shazam.p.rapidapi.com/songs/v2/detect',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'X-RapidAPI-Key': 'TU_RAPIDAPI_KEY', 
                    'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
                },
                timeout: 30000
            }
        )

        console.log('Respuesta Shazam:', JSON.stringify(response.data, null, 2))
        return response.data
    } catch (error) {
        console.error('Error en identifySong:', error.message)
        try {
            return await identifyWithAudd(audioBuffer)
        } catch (fallbackError) {
            console.error('Error en fallback:', fallbackError.message)
            throw error
        }
    }
}

async function identifyWithAudd(audioBuffer) {
    const formData = new FormData();
    formData.append('file', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
    });
    formData.append('return', 'spotify,apple_music,deezer');
    formData.append('api_token', 'TU_AUDD_API_TOKEN'); 
    const response = await axios.post(
        'https://api.audd.io/',
        formData,
        {
            headers: formData.getHeaders(),
            timeout: 30000
        }
    )

    if (response.data.status === 'success' && response.data.result) {
        const result = response.data.result
        return {
            track: {
                title: result.title,
                subtitle: result.artist,
                images: {
                    coverart: result.album_art || result.spotify?.album?.images?.[0]?.url
                },
                url: result.song_link,
                hub: {
                    actions: [
                        result.spotify && {
                            type: 'uri',
                            name: 'Spotify',
                            uri: result.spotify.external_urls?.spotify
                        },
                        result.apple_music && {
                            type: 'uri',
                            name: 'Apple Music',
                            uri: result.apple_music.url
                        },
                        result.deezer && {
                            type: 'uri',
                            name: 'Deezer',
                            uri: result.deezer.link
                        }
                    ].filter(Boolean)
                },
                sections: [
                    {
                        type: 'SONG',
                        metadata: [
                            { title: 'Album', text: result.album || 'N/A' },
                            { title: 'Released', text: result.release_date || 'N/A' }
                        ]
                    }
                ]
            }
        };
    }

    return null
}

export default shazamCommand;