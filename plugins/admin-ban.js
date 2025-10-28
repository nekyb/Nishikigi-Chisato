import { getMentionedUser } from '../handlers/messages.js';
import { isOwner } from '../config/bot.js';
const banCommand = {
    name: 'ban',
    aliases: ['banear'],
    category: 'admin',
    description: 'Banea a un usuario del grupo',
    usage: '#ban @user o responde a un mensaje',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: true,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.sender;
        try {
            let targetUser = getMentionedUser(msg);
            if (!targetUser && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetUser = msg.message.extendedTextMessage.contextInfo.participant;
            }
            if (!targetUser) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Etıquetα o responde αl mensαje de lα personα que quıeres bαneαr*'
                });
            }
            if (targetUser === sock.user.id) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》No me puedo bαneαr α mı mısmo.'
                });
            }
            const groupMetadata = await sock.groupMetadata(chatId);
            const ownerGroup = groupMetadata.owner || chatId.split('-')[0] + '@s.whatsapp.net';
            if (targetUser === ownerGroup) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》No puedo bαneαr αl propıetαrıo del grupo.'
                });
            }
            const targetNumber = targetUser.split('@')[0];
            if (isOwner(targetNumber)) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Solo el oɯner del grupo puede bαneαr α un αdmınıstrαdor.'
                });
            }
            const participant = groupMetadata.participants.find((p) => p.id === targetUser);
            const isTargetAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            const senderNumber = senderId.split('@')[0];
            const isCommanderOwner = senderId === ownerGroup || isOwner(senderNumber);
            if (isTargetAdmin && !isCommanderOwner) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 '
                });
            }
            await sock.sendMessage(chatId, {
                text: `《✧》 @${targetNumber} hα sıdo bαneαdo del grupo.`,
                mentions: [targetUser]
            });
            await sock.groupParticipantsUpdate(chatId, [targetUser], 'remove');
        }
        catch (error) {
            console.error('Error en comando ban:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》Ocurrıó un error αl ıntentαr bαneαr αl usuαrıo'
            });
        }
    }
};
export default banCommand;