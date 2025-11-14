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
            } 
               
            const apiUrl = `https://delirius-apiofc.vercel.app/download/mediafire?url=${encodeURIComponent(url)}`
            const response = await axios.get(apiUrl, {
                timeout: 60000
            })
            
            console.log('Respuesta API MediaFire:', JSON.stringify(response.data, null, 2))
            const data = response.data
            let file;
            if (data.data && Array.isArray(data.data) && data.data[0]) {
                file = data.data[0]
            } else if (data.data && !Array.isArray(data.data)) {
                file = data.data
            } else if (data.result) {
                file = data.result
            } else {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo obtener información del enlace.\n\n' +
                        '💡 *Tip:* Verifica que sea un link válido de MediaFire.'
                })
            }
            
            const downloadLink = file.link || file.url || file.download || file.downloadUrl
            
            if (!downloadLink) {
                console.log('Estructura del archivo:', JSON.stringify(file, null, 2))
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo obtener el enlace de descarga.\n\n' +
                        '💡 *Tip:* El archivo puede estar protegido o el enlace ha expirado.'
                })
            } await sock.sendMessage(chatId, {
                text: '《✧》 Descargando archivo...'
            })

            const fileName = file.nama || file.name || file.filename || 'archivo'
            const fileSize = file.size || file.filesize || 'N/A'
            const fileMime = file.mime || file.mimetype || file.type || 'application/octet-stream'

            const caption = `╔═══《 MEDIAFIRE 》═══╗\n` +
                `║\n` +
                `║ ✦ *Nombre:* ${fileName}\n` +
                `║ ✦ *Peso:* ${fileSize}\n` +
                `║ ✦ *Tipo:* ${fileMime}\n` +
                `║\n` +
                `╚═════════════════╝`;

            try {
                console.log('Descargando desde:', downloadLink)
                
                const fileResponse = await axios.get(downloadLink, {
                    responseType: 'arraybuffer',
                    timeout: 120000, 
                    maxContentLength: 100 * 1024 * 1024,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                })
                const buffer = Buffer.from(fileResponse.data);
                
                console.log('Archivo descargado, tamaño:', buffer.length, 'bytes')
                
                if (fileMime.includes('image')) { 
                    await sock.sendMessage(chatId, {
                        image: buffer,
                        caption: caption,
                        fileName: fileName
                    }, { quoted: msg })
                } else if (fileMime.includes('video')) { 
                    await sock.sendMessage(chatId, {
                        video: buffer,
                        caption: caption,
                        fileName: fileName.endsWith('.mp4') ? fileName : fileName + '.mp4',
                        mimetype: fileMime
                    }, { quoted: msg })
                } else if (fileMime.includes('audio')) { 
                    await sock.sendMessage(chatId, {
                        audio: buffer,
                        caption: caption,
                        fileName: fileName.endsWith('.mp3') ? fileName : fileName + '.mp3',
                        mimetype: fileMime
                    }, { quoted: msg })
                } else { 
                    await sock.sendMessage(chatId, {
                        document: buffer,
                        caption: caption,
                        fileName: fileName,
                        mimetype: fileMime
                    }, { quoted: msg })
                } 
                
                await sock.sendMessage(chatId, {
                    text: `《✧》 ✅ *Descarga completada*\n\n✿ Archivo: ${fileName}`
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