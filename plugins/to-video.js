// Correciones pendientes xd

import { writeFileSync, unlinkSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const tovideoCommand = {
    name: 'tovideo',
    aliases: ['tomp4', 'togif'],
    category: 'tools',
    description: 'Convierte un sticker o GIF a video',
    usage: '#tovideo [responder a sticker/gif]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            let mediaMessage = msg.message?.stickerMessage || msg.message?.imageMessage
            if (!mediaMessage && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage
                mediaMessage = quoted.stickerMessage || quoted.imageMessage
            }
            if (!mediaMessage) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Responde a un sticker o GIF con:\n` +
                        `✿ #tovideo`
                });
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 Convirtiendo a video...'
            })
            const buffer = await sock.downloadMediaMessage(msg.message?.stickerMessage || msg.message?.imageMessage ? msg :
                { message: msg.message.extendedTextMessage.contextInfo.quotedMessage })
            const inputPath = `./tmp/input_${Date.now()}.webp`
            const outputPath = `./tmp/output_${Date.now()}.mp4`
            writeFileSync(inputPath, buffer)
            await execAsync(`ffmpeg -i ${inputPath} -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${outputPath}`)
            const videoBuffer = require('fs').readFileSync(outputPath)
            await sock.sendMessage(chatId, {
                video: videoBuffer,
                caption: '《✧》 ✅ *Convertido a video*'
            }, { quoted: msg })
            unlinkSync(inputPath)
            unlinkSync(outputPath)
        }
        catch (error) {
            console.error('Error en tovideo:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al convertir a video.\n\n💡 *Tip:* Asegúrate de que ffmpeg esté instalado.'
            })
        }
    }
}

export default tovideoCommand