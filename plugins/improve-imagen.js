import { downloadMediaMessage } from '@whiskeysockets/baileys'
import axios from 'axios'

const improveCommand = {
    name: 'improve',
    aliases: ['mejorar', 'hd', 'enhance'],
    category: 'utils',
    description: 'Mejora la calidad de una imagen usando IA',
    usage: '#improve [responde a una imagen]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
            const hasQuotedImage = quotedMsg?.imageMessage
            const currentHasImage = msg.message?.imageMessage
            if (!hasQuotedImage && !currentHasImage) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Responde a una imagen con #improve para mejorar su calidad ✨'
                })
            } await sock.sendMessage(chatId, {
                text: '《✧》 Mejorando la calidad de la imagen, espere un momento... 🎨'
            })

            let imageBuffer
            try {
                if (hasQuotedImage) {
                    const contextInfo = msg.message.extendedTextMessage.contextInfo
                    const quotedMessage = {
                        key: {
                            remoteJid: contextInfo.participant || msg.key.remoteJid,
                            fromMe: false,
                            id: contextInfo.stanzaId
                        },
                        message: quotedMsg
                    }
                    imageBuffer = await downloadMediaMessage(quotedMessage, 'buffer', {})
                } else {
                    imageBuffer = await downloadMediaMessage(msg, 'buffer', {})
                }
                if (!imageBuffer || imageBuffer.length === 0) {
                    throw new Error('El buffer descargado está vacío')
                }
            } catch (downloadError) {
                console.error('Error al descargar imagen:', downloadError);
                throw new Error('No se pudo descargar la imagen. Intenta de nuevo.')
            }

            const FormData = (await import('form-data')).default
            const form = new FormData()
            form.append('image', imageBuffer, {
                filename: 'image.jpg',
                contentType: 'image/jpeg'
            })

            const response = await axios.post('https://api.deepai.org/api/torch-srgan', form, {
                headers: {
                    ...form.getHeaders(),
                    'api-key': '344d8ce4-16f6-4765-aa11-12b73678e3ba'
                },
                timeout: 60000
            })

            if (!response.data?.output_url) {
                throw new Error('La API no devolvió una imagen mejorada')
            }

            const improvedImageUrl = response.data.output_url;
            const improvedImageResponse = await axios.get(improvedImageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            })

            const improvedImageBuffer = Buffer.from(improvedImageResponse.data)
            await sock.sendMessage(chatId, {
                image: improvedImageBuffer,
                caption: '✨ *Imagen mejorada con IA*\n\n_Powered by DeltaByte_'
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en improve:', error)
            const errorMessage = error.message || 'No se pudo mejorar la imagen'
            const reportText = `Hola, tengo un problema con el comando #improve\n\n*Error:* ${errorMessage}\n\n*Comando usado:* #improve`
            const waLink = `https://wa.me/573115434166?text=${encodeURIComponent(reportText)}`
            try {
                await sock.sendMessage(chatId, {
                    text: `《✧》 *Error al mejorar imagen*\n\n📛 ${errorMessage}\n\n💡 _Asegúrate de que sea una imagen válida._`,
                    footer: 'Reino DeltaByte ⵑ',
                    buttons: [
                        {
                            buttonId: 'report_improve',
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
                    text: `《✧》 *Error al mejorar imagen*\n\n📛 ${errorMessage}\n\n📞 Reportar: ${waLink}`
                })
            }
        }
    }
}

export default improveCommand