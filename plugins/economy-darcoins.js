import { loadUsers, saveUsers } from '../lib/database.js';
import { getUserId, getChatId } from '../lib/getUserId.js';
const darcoinsCommand = {
    name: 'darcoins',
    aliases: ['givecoins', 'addcoins', 'dc'],
    category: 'economy',
    description: 'Dar coins a un usuario',
    usage: '#darcoins [cantidad] @usuario',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        try {
            if (args.length < 1) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Dar Coins* 《✧》\n\n` +
                        `*Uso:*\n` +
                        `✿ #darcoins [cantidad] @usuario\n` +
                        `✿ #darcoins [cantidad] (responder a un mensaje)\n\n` +
                        `*Ejemplos:*\n` +
                        `• #darcoins 5000 @usuario\n` +
                        `• #darcoins 10000 (respondiendo)\n\n` +
                        `💎 *Nota:* La cantidad debe ser un número positivo.`
                }, { quoted: msg });
            }

            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ *Error*\n\n' +
                        'La cantidad debe ser un número positivo.\n\n' +
                        '*Ejemplo:* #darcoins 5000 @usuario'
                }, { quoted: msg });
            }

            let targetUserId = null;
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentionedJid && mentionedJid.length > 0) {
                targetUserId = mentionedJid[0];
            }

            if (!targetUserId && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedParticipant = msg.message.extendedTextMessage.contextInfo.participant;
                if (quotedParticipant) {
                    targetUserId = quotedParticipant;
                }
            }
            if (!targetUserId) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ *Error*\n\n' +
                        'No se pudo identificar al usuario.\n\n' +
                        '*Opciones:*\n' +
                        '• Menciona al usuario: @usuario\n' +
                        '• Responde a su mensaje'
                }, { quoted: msg });
            }

            if (targetUserId === senderId) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No puedes darte coins a ti mismo.'
                }, { quoted: msg });
            }

            const users = await loadUsers();
            if (!users[senderId]) {
                users[senderId] = {
                    name: 'Usuario',
                    coins: 0,
                    last_work: null,
                    last_daily: null,
                    last_chess: null,
                    last_crime: null,
                    last_slut: null,
                    daily_streak: 0,
                    registered_at: new Date().toISOString()
                };
            }
            if (users[senderId].coins < amount) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ *Saldo Insuficiente*\n\n` +
                        `💰 *Tienes:* ${users[senderId].coins.toLocaleString()} Coins\n` +
                        `💸 *Intentas dar:* ${amount.toLocaleString()} Coins\n` +
                        `📉 *Te faltan:* ${(amount - users[senderId].coins).toLocaleString()} Coins`
                }, { quoted: msg });
            }
            if (!users[targetUserId]) {
                let userName = 'Usuario';
                try {
                    const contact = await sock.onWhatsApp(targetUserId);
                    if (contact && contact[0]?.notify) {
                        userName = contact[0].notify;
                    }
                } catch (e) {
                    console.log('No se pudo obtener el nombre del usuario');
                }
                users[targetUserId] = {
                    name: userName,
                    coins: 0,
                    last_work: null,
                    last_daily: null,
                    last_chess: null,
                    last_crime: null,
                    last_slut: null,
                    daily_streak: 0,
                    registered_at: new Date().toISOString()
                };
            }

            users[senderId].coins -= amount;
            users[targetUserId].coins += amount;
            await saveUsers(users);
            const senderName = users[senderId].name || 'Usuario';
            const targetName = users[targetUserId].name || 'Usuario';
            await sock.sendMessage(chatId, {
                text: `《✧》 *Transferencia Exitosa* 《✧》\n\n` +
                    `💰 *Cantidad:* ${amount.toLocaleString()} Coins\n` +
                    `👤 *De:* ${senderName}\n` +
                    `👤 *Para:* ${targetName}\n\n` +
                    `📊 *Tu nuevo balance:* ${users[senderId].coins.toLocaleString()} Coins\n` +
                    `📊 *Balance de ${targetName}:* ${users[targetUserId].coins.toLocaleString()} Coins\n\n` +
                    `✅ Transferencia completada.`,
                mentions: [targetUserId]
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en comando darcoins:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Error al dar coins\n\n' +
                    `💡 Error: ${error.message || 'Desconocido'}`
            }, { quoted: msg });
        }
    }
};
export default darcoinsCommand;
//# sourceMappingURL=darcoins.js.map