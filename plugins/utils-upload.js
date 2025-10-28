import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
const CLOUDBOX_API = 'https://cloudbox-cvg1-00212-2025-c2.gt.tc/api.php'
const MAX_SIZE = 100 * 1024 * 1024
const uploadCommand = {
    name: 'upload',
    aliases: ['subir'],
    category: 'tools',
    description: 'Sube archivos a CloudBox y obtén un link directo',
    usage: '#upload o #subir (responde a un archivo)',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
            if (!quotedMsg) {
                await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor responde a un archivo para subirlo.\n\n' +
                          '*Tipos soportados:*\n' +
                          '• Imágenes\n' +
                          '• Videos\n' +
                          '• Audios\n' +
                          '• Documentos\n' +
                          '• Stickers'
                }, { quoted: msg })
                return
            }

            let mediaType = null
            let mediaMsg = null
            let fileName = 'archivo'
            let mimeType = 'application/octet-stream'
            if (quotedMsg.imageMessage) {
                mediaType = 'image'
                mediaMsg = quotedMsg.imageMessage
                fileName = 'imagen.jpg'
                mimeType = mediaMsg.mimetype || 'image/jpeg'
            } else if (quotedMsg.videoMessage) {
                mediaType = 'video'
                mediaMsg = quotedMsg.videoMessage
                fileName = 'video.mp4'
                mimeType = mediaMsg.mimetype || 'video/mp4'
            } else if (quotedMsg.audioMessage) {
                mediaType = 'audio'
                mediaMsg = quotedMsg.audioMessage
                fileName = 'audio.mp3'
                mimeType = mediaMsg.mimetype || 'audio/mpeg'
            } else if (quotedMsg.documentMessage) {
                mediaType = 'document'
                mediaMsg = quotedMsg.documentMessage
                fileName = mediaMsg.fileName || 'documento';
                mimeType = mediaMsg.mimetype || 'application/octet-stream'
            } else if (quotedMsg.stickerMessage) {
                mediaType = 'sticker'
                mediaMsg = quotedMsg.stickerMessage;
                fileName = 'sticker.webp'
                mimeType = 'image/webp'
            } else {
                await sock.sendMessage(chatId, {
                    text: '《✧》 El mensaje citado no contiene un archivo válido.'
                }, { quoted: msg })
                return
            }

            const fileSize = mediaMsg.fileLength || 0;
            const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2)
            if (fileSize > MAX_SIZE) {
                await sock.sendMessage(chatId, {
                    text: `《✧》 El archivo es demasiado grande (${fileSizeMB} MB).\n\n` +
                          `⚠️ Límite máximo: 100 MB`
                }, { quoted: msg })
                return
            }

            await sock.sendMessage(chatId, {
                text: `⏳ Subiendo archivo a CloudBox...\n\n` +
                      `📁 *Nombre:* ${fileName}\n` +
                      `💾 *Tamaño:* ${fileSizeMB} MB`
            }, { quoted: msg })
            const fullMsg = {
                key: msg.message.extendedTextMessage.contextInfo.participant 
                    ? {
                        remoteJid: chatId,
                        fromMe: false,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: msg.message.extendedTextMessage.contextInfo.participant
                    }
                    : {
                        remoteJid: chatId,
                        fromMe: false,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId
                    },
                message: quotedMsg
            }

            const buffer = await downloadMediaMessage(
                fullMsg,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            const formData = new FormData()
            formData.append('file', buffer, {
                filename: fileName,
                contentType: mimeType
            })

            const response = await axios.post(CLOUDBOX_API, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000 
            })

            if (response.data.success) {
                const uploadData = response.data.data
                await sock.sendMessage(chatId, {
                    text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                          `┃  *✅ Archivo Subido*\n` +
                          `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                          `📁 *Nombre:* ${uploadData.filename}\n` +
                          `💾 *Tamaño:* ${(uploadData.size / 1024).toFixed(2)} KB\n` +
                          `🆔 *Carpeta:* ${uploadData.folder_id}\n\n` +
                          `🔗 *Link directo:*\n${uploadData.url}`
                }, { quoted: msg })
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✧》 Error al subir el archivo:\n${response.data.error || 'Error desconocido'}`
                }, { quoted: msg })
            }
        } catch (error) {
            console.error('Error en comando upload:', error)
            let errorMsg = '《✧》 Error al subir el archivo.'
            if (error.code === 'ECONNABORTED') {
                errorMsg = '《✧》 Tiempo de espera agotado. El archivo es muy grande o la conexión es lenta.'
            } else if (error.response?.data?.error) {
                errorMsg = `《✧》 Error: ${error.response.data.error}`
            } else if (error.message) {
                errorMsg = `《✧》 Error: ${error.message}`
            } await sock.sendMessage(chatId, {
                text: errorMsg
            }, { quoted: msg })
        }
    }
}

export default uploadCommand