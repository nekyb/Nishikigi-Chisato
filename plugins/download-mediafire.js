import axios from 'axios'

const mediafireCommand = {
    name: 'mediafire',
    aliases: ['mf', 'mfdl'],
    category: 'downloads',
    description: 'Descarga archivos de MediaFire',
    usage: '#mediafire [url de MediaFire]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #mediafire https://www.mediafire.com/file/xxxxx\n` +
                        `✿ #mf https://www.mediafire.com/file/xxxxx`
                })
            }
            const url = args[0]
            if (!url.includes('mediafire.com')) { return await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor ingresa un link válido de MediaFire.'
                })
            } await sock.sendMessage(chatId, {
                text: '《✧》 Obteniendo información del archivo...'
            })

            const apiUrl = `https://delirius-apiofc.vercel.app/download/mediafire?url=${encodeURIComponent(url)}`
            const response = await axios.get(apiUrl, {
                timeout: 30000
            })
            const data = response.data
            if (!data || !data.data || !data.data[0]) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo obtener información del enlace.\n\n' +
                        '💡 *Tip:* Verifica que sea un link válido de MediaFire.'
                })
            }
            const file = data.data[0]
            if (!file.link) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo obtener el enlace de descarga.'
                })
            } await sock.sendMessage(chatId, {
                text: '《✧》 Descargando archivo...'
            })

            const caption = `╔═══《 MEDIAFIRE 》═══╗\n` +
                `║\n` +
                `║ ✦ *Nombre:* ${file.nama || 'Desconocido'}\n` +
                `║ ✦ *Peso:* ${file.size || 'N/A'}\n` +
                `║ ✦ *Tipo:* ${file.mime || 'N/A'}\n` +
                `║\n` +
                `╚═════════════════╝`;

            try {
                const fileResponse = await axios.get(file.link, {
                    responseType: 'arraybuffer',
                    timeout: 60000, 
                    maxContentLength: 100 * 1024 * 1024 
                })
                const buffer = Buffer.from(fileResponse.data);
                if (file.mime?.includes('image')) { await sock.sendMessage(chatId, {
                        image: buffer,
                        caption: caption,
                        fileName: file.nama || 'archivo'
                    }, { quoted: msg })
                } else if (file.mime?.includes('video')) { await sock.sendMessage(chatId, {
                        video: buffer,
                        caption: caption,
                        fileName: file.nama || 'video.mp4',
                        mimetype: file.mime
                    }, { quoted: msg })
                } else if (file.mime?.includes('audio')) { await sock.sendMessage(chatId, {
                        audio: buffer,
                        caption: caption,
                        fileName: file.nama || 'audio.mp3',
                        mimetype: file.mime
                    }, { quoted: msg })
                } else { await sock.sendMessage(chatId, {
                        document: buffer,
                        caption: caption,
                        fileName: file.nama || 'archivo',
                        mimetype: file.mime || 'application/octet-stream'
                    }, { quoted: msg })
                } await sock.sendMessage(chatId, {
                    text: `《✧》 ✅ *Descarga completada*\n\n✿ Archivo: ${file.nama || 'archivo'}`
                })
            } catch (downloadError) {
                console.error('Error al descargar archivo:', downloadError)
                if (downloadError.code === 'ECONNABORTED' || downloadError.message?.includes('timeout')) {
                    return await sock.sendMessage(chatId, {
                        text: '《✧》 El archivo es demasiado grande o la descarga tardó mucho.\n\n' +
                            '💡 *Tip:* Intenta con archivos más pequeños.'
                    })
                } return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al descargar el archivo.\n\n' +
                        '💡 *Tip:* El archivo puede ser demasiado grande o el enlace ha expirado.'
                })
            }
        } catch (error) {
            console.error('Error en comando mediafire:', error)
            let errorMessage = '《✧》 Error al procesar el enlace de MediaFire.'
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La solicitud tardó demasiado. Intenta de nuevo.'
            } else if (error.response?.status === 404) {
                errorMessage = '《✧》 El archivo no fue encontrado o el enlace es inválido.'
            } else if (error.response?.status === 400) {
                errorMessage = '《✧》 URL inválida. Verifica el enlace.'
            } else if (error.response?.status === 429) {
                errorMessage = '《✧》 Demasiadas solicitudes. Espera unos momentos.'
            } else if (!error.response) {
                errorMessage = '《✧》 No se pudo conectar con el servicio de descarga.'
            } await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Asegúrate de que el enlace de MediaFire sea válido y público.`
            })
        }
    }
}

export default mediafireCommand