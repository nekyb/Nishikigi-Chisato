import { image } from 'image-downloader'
import fs from 'fs'
import path from 'path'

const imgdlCommand = {
    name: 'imgdl',
    aliases: ['imagedl', 'descargaimg'],
    category: 'downloads',
    description: 'Descarga una imagen desde un enlace directo.',
    usage: '#imgdl [enlace directo a imagen]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Uso incorrecto del comando*\n\n' +
                        'Ejemplo:\n' +
                        '✿ #imgdl https://ejemplo.com/foto.png'
                })
            }

            const url = args[0]
            if (!url.startsWith('http')) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor, introduce una URL válida (ej. https://...).'
                })
            } await sock.sendMessage(chatId, {
                text: `《✧》 Iniciando descarga de imagen desde ${url}...`
            })

            const dest = path.join('/tmp', `image_dl_${Date.now()}`)
            const options = {
                url: url,
                dest: dest,
                extractFilename: true
            }

            const { filename } = await image(options)
            await sock.sendMessage(chatId, {
                image: { url: filename },
                caption: `✅ Descarga de Imagen completada: ${path.basename(filename)}`
            }, { quoted: msg })
            fs.unlinkSync(filename)
        } catch (error) {
            console.error('Error en comando imgdl:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al descargar la imagen. Asegúrate de que el enlace sea directo a una imagen.'
            })
        }
    }
}

export default imgdlCommand