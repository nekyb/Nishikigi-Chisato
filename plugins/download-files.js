import axios from 'axios'
import fs from 'fs'
import path from 'path'

const webdlCommand = {
    name: 'webdl',
    aliases: ['filedl', 'descarga'],
    category: 'downloads',
    description: 'Descarga un archivo (imagen, documento, etc.) desde un enlace directo.',
    usage: '#webdl [enlace directo] [nombre_archivo.ext]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length < 1) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Uso incorrecto del comando*\n\n' +
                        'Ejemplo:\n' +
                        '✿ #webdl https://ejemplo.com/imagen.jpg mi_imagen.jpg'
                })
            }

            const url = args[0]
            const fileName = args[1] || path.basename(new URL(url).pathname) || `descarga_${Date.now()}`
            const filePath = path.join('/tmp', fileName)
            await sock.sendMessage(chatId, {
                text: `《✧》 Iniciando descarga de ${fileName} desde ${url}...`
            })

            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
                timeout: 60000 
            })

            const writer = fs.createWriteStream(filePath)
            response.data.pipe(writer)
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            
            const mimeType = response.headers['content-type'] || 'application/octet-stream'
            await sock.sendMessage(chatId, {
                document: { url: filePath },
                mimetype: mimeType,
                fileName: fileName,
                caption: `✅ Descarga completada: ${fileName}`
            }, { quoted: msg })
            fs.unlinkSync(filePath)
        } catch (error) {
            console.error('Error en comando webdl:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al descargar el archivo. Asegúrate de que el enlace sea un enlace directo.'
            })
        }
    }
}

export default webdlCommand
