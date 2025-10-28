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
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Responde a un sticker con:\n` +
                        `✿ #toimg`
                });
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 Convirtiendo a imagen...'
            });
            const buffer = await sock.downloadMediaMessage(msg.message?.stickerMessage ? msg :
                { message: { stickerMessage: msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage } });
            await sock.sendMessage(chatId, {
                image: buffer,
                caption: '《✧》 ✅ *Convertido a imagen*'
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en toimg:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al convertir a imagen.'
            });
        }
    }
};
export default toimgCommand;
//# sourceMappingURL=to-img.js.map