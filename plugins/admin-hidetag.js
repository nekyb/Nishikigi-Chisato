const hidetagCommand = {
    name: 'hidetag',
    aliases: ['ht', 'notify'],
    category: 'group',
    description: 'Menciona a todos sin que se vea',
    usage: '#hidetag [mensaje]',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key?.remoteJid;
        if (!chatId) {
            console.error('Error: No se pudo obtener el chatId');
            return;
        }
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants.map((p) => p.id);
            let text = args.join(' ');
            if (!text && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
                text = quoted.conversation ||
                    quoted.extendedTextMessage?.text ||
                    quoted.imageMessage?.caption ||
                    quoted.videoMessage?.caption ||
                    quoted.documentMessage?.caption ||
                    quoted.audioMessage?.caption ||
                    'Mensaje citado';
            }
            if (!text && msg.message?.conversation) {
                text = msg.message.conversation;
            }
            if (!text && msg.message?.extendedTextMessage?.text) {
                text = msg.message.extendedTextMessage.text;
            }
            if (!text) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Uso ıncorrecto*\n\n' +
                        '💡 Ejemplos:\n' +
                        '✿ #hıdetαg Holα α todos\n' +
                        '✿ #hıdetαg (responder α un mensαje)'
                }, { quoted: msg });
            }
            await sock.sendMessage(chatId, {
                text: text,
                mentions: participants
            }, { quoted: msg });
        }
        catch (err) {
            console.error('Error en hidetag:', err);
            let errorMsg = '《✧》Error αl envıαr el mensαje.';
            const errorMessage = err?.message || err?.toString() || '';
            if (errorMessage.includes('not-participant') || errorMessage.includes('participant')) {
                errorMsg = '《✧》El bot no es pαrtıcıpαnte del grupo.';
            }
            else if (errorMessage.includes('not a group') || errorMessage.includes('group')) {
                errorMsg = '《✧》Este comαndo solo funcıonα en grupos.';
            }
            else if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
                errorMsg = '《✧》El bot no tıene permısos pαrα mencıonαr α todos.';
            }
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
        }
    }
};
export default hidetagCommand