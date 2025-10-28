import { getMentionedUser } from '../handlers/messages.js';
import { isOwner } from '../config/bot.js';

const kickCommand = {
    name: 'kick',
    aliases: ['echar', 'hechar', 'expulsar'],
    category: 'admin',
    description: 'Expulsa a un usuario del grupo',
    usage: '#kick @user o responde a un mensaje',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: true,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        try {
            let targetUser = getMentionedUser(msg);
            if (!targetUser && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetUser = msg.message.extendedTextMessage.contextInfo.participant;
            }
            if (!targetUser) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Etiqueta o responde al mensaje de la persona que quieres eliminar*'
                }, { quoted: msg });
            }
            if (targetUser === sock.user.id.split(':')[0] + '@s.whatsapp.net') {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No puedo eliminar el bot del grupo'
                }, { quoted: msg });
            }
            const groupMetadata = await sock.groupMetadata(chatId);
            const ownerGroup = groupMetadata.owner || chatId.split('-')[0] + '@s.whatsapp.net';
            if (targetUser === ownerGroup) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No puedo eliminar al propietario del grupo'
                }, { quoted: msg });
            }
            const targetNumber = targetUser.split('@')[0];
            if (isOwner(targetNumber)) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No puedo eliminar al propietario del bot'
                }, { quoted: msg });
            }
            const participant = groupMetadata.participants.find((p) => p.id === targetUser);
            const isTargetAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            const senderNumber = senderId.split('@')[0];
            const isCommanderOwner = senderId === ownerGroup || isOwner(senderNumber);
            if (isTargetAdmin && !isCommanderOwner) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Solo el owner del grupo puede expulsar a un administrador'
                }, { quoted: msg });
            }
            if (!participant) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 El usuario no se encuentra en el grupo'
                }, { quoted: msg });
            }
            await sock.sendMessage(chatId, {
                text: `《✧》 @${targetNumber} ha sido expulsado del grupo.`,
                mentions: [targetUser]
            }, { quoted: msg });
            const response = await sock.groupParticipantsUpdate(chatId, [targetUser], 'remove');
            if (response[0]?.status === '404') {
                await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo encontrar al usuario en el grupo'
                }, { quoted: msg });
            }
            else if (response[0]?.status !== '200') {
                await sock.sendMessage(chatId, {
                    text: '《✧》 Hubo un problema al expulsar al usuario'
                }, { quoted: msg });
            }
        }
        catch (error) {
            console.error('Error en comando kick:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Ocurrió un error al intentar expulsar al usuario'
            }, { quoted: msg });
        }
    }
};
export default kickCommand;