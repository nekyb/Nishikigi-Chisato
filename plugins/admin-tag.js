import { getGroupParticipants } from '../handlers/events.js'
const tagCommand = {
    name: 'tag',
    aliases: ['hidetag', 'notificar', 'tagall'],
    category: 'admin',
    description: 'Etiqueta a todos los miembros del grupo',
    usage: '#tag [mensaje] o responde a un mensaje/imagen',
    adminOnly: true,
    groupOnly: true,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            const participants = await getGroupParticipants(sock, chatId);
            const mentions = participants.map((p) => p.id);
            const messageText = args.join(' ');
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!messageText && !quotedMsg) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Ingresa un texto para etiquetar a todos\nEjemplo: #tag Hola a todos!'
                });
            }
            const more = String.fromCharCode(8206);
            const masss = more.repeat(850);
            let finalText = messageText || '*¡₳₮Ɇ₦₵łØ₦ ₳ ₮ØĐØ₴!*';
            if (quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text) {
                const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
                finalText = `${messageText || ''}\n\n━━━━━━━━━━━━━━━\n${quotedText}`
            }
            if (quotedMsg?.imageMessage) {
                const caption = quotedMsg.imageMessage.caption || '';
                const imageCaption = messageText
                    ? `${messageText}\n\n${caption}`
                    : caption || '*¡₳₮Ɇ₦₵łØ₦ ₳ ₮ØĐØ₴!*';
                try {
                    const quotedImage = {
                        message: quotedMsg,
                        key: msg.message.extendedTextMessage.contextInfo
                    };
                    const imageBuffer = await sock.downloadMediaMessage(quotedImage)
                    if (imageBuffer) {
                        return await sock.sendMessage(chatId, {
                            image: imageBuffer,
                            caption: imageCaption,
                            mentions: mentions
                        })
                    }
                }
                catch (error) {
                    console.error('Error procesando imagen citada:', error)
                }
            }
            if (quotedMsg?.videoMessage) {
                const caption = quotedMsg.videoMessage.caption || ''
                const videoCaption = messageText
                    ? `${messageText}\n\n${caption}`
                    : caption || '*¡Atención a todos!*'
                try {
                    const quotedVideo = {
                        message: quotedMsg,
                        key: msg.message.extendedTextMessage.contextInfo
                    };
                    const videoBuffer = await sock.downloadMediaMessage(quotedVideo)
                    if (videoBuffer) {
                        return await sock.sendMessage(chatId, {
                            video: videoBuffer,
                            caption: videoCaption,
                            mentions: mentions,
                            mimetype: 'video/mp4'
                        });
                    }
                }
                catch (error) {
                    console.error('Error procesando video citado:', error)
                }
            }
            if (quotedMsg?.audioMessage) {
                try {
                    const quotedAudio = {
                        message: quotedMsg,
                        key: msg.message.extendedTextMessage.contextInfo
                    };
                    const audioBuffer = await sock.downloadMediaMessage(quotedAudio)
                    if (audioBuffer) {
                        return await sock.sendMessage(chatId, {
                            audio: audioBuffer,
                            mentions: mentions,
                            mimetype: 'audio/mp4',
                            ptt: quotedMsg.audioMessage.ptt || false
                        });
                    }
                }
                catch (error) {
                    console.error('Error procesando audio citado:', error)
                }
            }
            if (quotedMsg?.stickerMessage) {
                try {
                    const quotedSticker = {
                        message: quotedMsg,
                        key: msg.message.extendedTextMessage.contextInfo
                    };
                    const stickerBuffer = await sock.downloadMediaMessage(quotedSticker)
                    if (stickerBuffer) {
                        await sock.sendMessage(chatId, {
                            sticker: stickerBuffer
                        });
                        if (messageText) {
                            return await sock.sendMessage(chatId, {
                                text: `${masss}\n${messageText}`,
                                mentions: mentions
                            });
                        }
                        return;
                    }
                }
                catch (error) {
                    console.error('Error procesando sticker citado:', error)
                }
            }
            await sock.sendMessage(chatId, {
                text: `${masss}\n${finalText}`,
                mentions: mentions
            });
        }
        catch (error) {
            console.error('Error en comando tag:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Ocurrió un error al intentar etiquetar a todos'
            });
        }
    }
};
export default tagCommand;