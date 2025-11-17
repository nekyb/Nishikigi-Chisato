import { downloadMediaMessage } from '@soblend/baileys';
import sharp from 'sharp';

const toimgCommand = {
    name: 'toimg',
    aliases: ['img', 'topng'],
    category: 'tools',
    description: 'Convierte un sticker a imagen',
    usage: '#toimg [responder a sticker]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        try {
            let stickerMessage = msg.message?.stickerMessage;
            if (!stickerMessage && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                stickerMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
            }

            if (!stickerMessage) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Uso incorrecto del comando*\n\n` +
                        `Responde a un sticker con:\n` +
                        `✿ #toimg`
                }, { quoted: msg });
            }

            let buffer;
            try {
                console.log(`📥 Descargando sticker...`);
                buffer = await downloadMediaMessage(
                    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? 
                    { message: msg.message.extendedTextMessage.contextInfo.quotedMessage } : 
                    msg,
                    'buffer',
                    {},
                    { 
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
                console.log(`✅ Sticker descargado: ${buffer.length} bytes`);
            } catch (downloadError) {
                console.error('Error descargando sticker:', downloadError.message);
                return await sock.sendMessage(chatId, {
                    text: '《✿》 Error al descargar el sticker.'
                }, { quoted: msg });
            }

            if (!buffer || buffer.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✿》 No se pudo procesar el sticker.'
                }, { quoted: msg });
            }

            let imageBuffer;
            try {
                console.log(`🔄 Convirtiendo WEBP a PNG con Sharp...`);
                imageBuffer = await sharp(buffer)
                    .png({
                        quality: 100,
                        compressionLevel: 6
                    })
                    .toBuffer();
                
                console.log(`✅ Convertido exitosamente: ${imageBuffer.length} bytes`);
            } catch (convertError) {
                console.error('Error al convertir:', convertError.message);
                return await sock.sendMessage(chatId, {
                    text: '《✿》 Error al convertir el sticker a imagen.'
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: '《✿》 *Convertido a imagen*'
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en toimg:', error);
            await sock.sendMessage(chatId, {
                text: '《✿》 Error al convertir a imagen.'
            }, { quoted: msg });
        }
    }
};

export default toimgCommand;