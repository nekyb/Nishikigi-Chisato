import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import sharp from 'sharp';

export default {
    name: 'sticker',
    aliases: ['s', 'stiker', 'stick'],
    category: 'utils',
    description: 'Convierte imágenes o videos en stickers de WhatsApp',
    usage: '#sticker [responde a una imagen/video]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = quotedMsg?.imageMessage || msg.message?.imageMessage;
            const videoMsg = quotedMsg?.videoMessage || msg.message?.videoMessage;

            if (!imageMsg && !videoMsg) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Creador de Stickers*\n\n` +
                        `Uso:\n` +
                        `1. Envía o responde a una imagen/video\n` +
                        `2. Usa #sticker o #s\n\n` +
                        `Opciones:\n` +
                        `✿ #sticker - Sticker normal\n` +
                        `✿ #sticker crop - Sin recorte automático\n` +
                        `✿ #sticker circle - Sticker circular\n\n` +
                        `💡 Videos máximo 10 segundos`
                });
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 🎨 Creando sticker...'
            });

            const mediaMsg = imageMsg ? quotedMsg || msg : quotedMsg || msg;
            const buffer = await sock.downloadMediaMessage(mediaMsg);

            if (!buffer) {
                throw new Error('No se pudo descargar el medio');
            }

            const stickerOptions = {
                pack: 'Nishikigi Chisato',
                author: 'Bot by DeltaByte',
                type: StickerTypes.FULL,
                quality: 100
            };

            if (args.includes('crop')) {
                stickerOptions.type = StickerTypes.CROPPED;
            } else if (args.includes('circle')) {
                stickerOptions.type = StickerTypes.CIRCLE;
            }

            let processedBuffer = buffer;

            if (imageMsg) {
                try {
                    processedBuffer = await sharp(buffer)
                        .resize(512, 512, {
                            fit: 'contain',
                            background: { r: 0, g: 0, b: 0, alpha: 0 }
                        })
                        .webp({ quality: 95 })
                        .toBuffer();
                } catch (sharpError) {
                    console.log('Usando buffer original:', sharpError.message);
                }
            }

            const sticker = new Sticker(processedBuffer, stickerOptions);
            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(chatId, {
                sticker: stickerBuffer
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en sticker:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al crear sticker.\n\n` +
                    `Verifica que sea una imagen o video válido (máx 10s para videos).\n\n` +
                    `Detalles: ${error.message}`
            });
        }
    }
};
