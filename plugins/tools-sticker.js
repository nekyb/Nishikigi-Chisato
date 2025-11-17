import pkg from '@soblend/baileys';
const { downloadMediaMessage } = pkg;
import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import axios from 'axios';
async function fetchBuffer(url) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
            return Buffer.from(response.data);
        } catch (error) {
            console.error(`Error fetching ${url} (attempt ${i + 1}):`, error)
            if (i === maxRetries - 1)
                throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
    }
    throw new Error('Failed to fetch buffer');
}
function isUrl(text) {
    return /^https?:\/\/.*\.(jpe?g|gif|png|webp|mp4)$/i.test(text)
}
const stickerCommand = {
    name: 'sticker',
    aliases: ['s', 'stiker'],
    category: 'utils',
    description: 'Convierte imágenes, videos o GIFs en stickers',
    usage: '#sticker [responde a imagen/video/gif o proporciona URL]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
            const hasQuotedImage = quotedMsg?.imageMessage
            const hasQuotedVideo = quotedMsg?.videoMessage
            const currentHasImage = msg.message?.imageMessage
            const currentHasVideo = msg.message?.videoMessage
            const packname = '𝕽𝖊𝖎𝖓𝖔 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊ⵑ'
            const author = 'ØⱤ₵₳ⱠɆⱤØ ØⱤ₵₳Ⱡ₳ 2.0'
            const MAX_FILE_SIZE = 15 * 1024 * 1024
            let mediaBuffer = null
            let isVideo = false
            if (hasQuotedVideo || currentHasVideo) {
                isVideo = true
                const videoMsg = hasQuotedVideo ? quotedMsg.videoMessage : msg.message.videoMessage
                if (videoMsg?.seconds && videoMsg.seconds > 10) {
                    return await sock.sendMessage(chatId, {
                        text: '⚠️ El video no puede durar más de 10 segundos.'
                    });
                }
            }

            if (hasQuotedImage || hasQuotedVideo || currentHasImage || currentHasVideo) {
                try {
                    if (hasQuotedImage || hasQuotedVideo) {
                        const contextInfo = msg.message.extendedTextMessage.contextInfo
                        const quotedMessage = {
                            key: {
                                remoteJid: contextInfo.participant || msg.key.remoteJid,
                                fromMe: false,
                                id: contextInfo.stanzaId
                            },
                            message: quotedMsg
                        };
                        mediaBuffer = await downloadMediaMessage(quotedMessage, 'buffer', {})
                    }
                    else {
                        mediaBuffer = await downloadMediaMessage(msg, 'buffer', {})
                    }
                    if (!mediaBuffer || mediaBuffer.length === 0) {
                        throw new Error('El buffer descargado está vacío')
                    }
                    if (mediaBuffer.length > MAX_FILE_SIZE) {
                        return await sock.sendMessage(chatId, {
                            text: '⚠️ El archivo es demasiado grande. Máximo 15 MB.'
                        });
                    }
                } catch (error) {
                    console.error('Error al descargar media:', error)
                    throw new Error('No se pudo descargar el archivo')
                }
            } else if (args.length > 0 && isUrl(args[0])) {
                try {
                    mediaBuffer = await fetchBuffer(args[0])
                    isVideo = /\.(mp4|gif)$/i.test(args[0])
                } catch (error) {
                    throw new Error('No se pudo descargar la imagen desde la URL')
                }
            }
            else {
                return await sock.sendMessage(chatId, {
                    text: '❌ Responde a una imagen/video/gif o envía una URL válida.\n\n📝 Uso: #sticker [imagen/video]'
                });
            }
            if (mediaBuffer) {
                try {
                    const sticker = new Sticker(mediaBuffer, {
                        pack: packname,
                        author: author,
                        type: isVideo ? StickerTypes.FULL : StickerTypes.DEFAULT,
                        quality: 75,
                    })
                    const stickerBuffer = await sticker.toBuffer();
                    await sock.sendMessage(chatId, {
                        sticker: stickerBuffer
                    }, { quoted: msg });
                }
                catch (stickerError) {
                    console.error('Error al crear sticker:', stickerError);
                    throw new Error('No se pudo procesar el sticker. Intenta con otro archivo.')
                }
            }
        }
        catch (error) {
            console.error('Error en sticker:', error)
            const errorMessage = error.message || 'Error desconocido'
            const reportText = `Hola, tengo un problema con el comando #sticker\n\n*Error:* ${errorMessage}\n\n*Comando usado:* #sticker ${args.join(' ')}`
            const waLink = `https://wa.me/573115434166?text=${encodeURIComponent(reportText)}`
            try {
                await sock.sendMessage(chatId, {
                    text: `《✿》 *Error al crear sticker*\n\n📛 ${errorMessage}\n\n💡 _Intenta con un archivo más pequeño o diferente formato._`,
                    footer: 'Reino DeltaByte ⵑ',
                    buttons: [
                        {
                            buttonId: 'report_btn',
                            buttonText: { displayText: '📞 Reportar Error' },
                            type: 1
                        }
                    ],
                    headerType: 1
                })
                await sock.sendMessage(chatId, {
                    text: `📞 Reportar directamente:\n${waLink}`
                })
            } catch (btnError) {
                await sock.sendMessage(chatId, {
                    text: `《✿》 *Error al crear sticker*\n\n📛 ${errorMessage}\n\n📞 Reportar: ${waLink}`
                })
            }
        }
    }
}
export default stickerCommand