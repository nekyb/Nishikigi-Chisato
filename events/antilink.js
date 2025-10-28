import { getGroupSettings } from '../database/users.js';
export const antilinkEvent = {
    name: 'antilink',
    enabled: true,
    linkRegex: /\b((https?:\/\/|www\.)?[\w-]+\.[\w-]+(?:\.[\w-]+)*(\/[\w\.\-\/]*)?)\b/i,
    async handleMessage(sock, msg, isAdmin, isBotAdmin) {
        try {
            if (!msg.isGroup || isAdmin)
                return false;
            const settings = await getGroupSettings(msg.key.remoteJid);
            if (!settings || !settings.antilink)
                return false;
            const messageText = this.getMessageText(msg);
            if (!messageText)
                return false;
            const hasLink = this.linkRegex.test(messageText);
            if (!hasLink)
                return false;
            if (!isBotAdmin) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: 'No soч αdmın por lo tαnto no puedo reαlızαr lα αccıon...'
                });
                return false;
            }
            const groupInviteCode = await sock.groupInviteCode(msg.key.remoteJid);
            const thisGroupLink = `https://chat.whatsapp.com/${groupInviteCode}`;
            const allowedLinks = [
                thisGroupLink,
                'https://www.youtube.com/',
                'https://youtu.be/',
                'youtube.com',
                'youtu.be'
            ];
            const isAllowedLink = allowedLinks.some(allowed => messageText.toLowerCase().includes(allowed.toLowerCase()));
            if (isAllowedLink)
                return false;
            const sender = msg.key.participant || msg.key.remoteJid;
            const userNumber = sender.split('@')[0];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*「 𝐀𝐍𝐓𝐈 𝐋𝐈𝐍𝐊𝐒 」*\n\n𝐍𝐮𝐧𝐜𝐚 𝐚𝐩𝐫𝐞𝐧𝐝𝐞𝐧 🙄 @${userNumber}\n𝐀𝐬 𝐫𝐨𝐭𝐨 𝐥𝐚𝐬 𝐫𝐞𝐠𝐥𝐚𝐬 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐨, 𝐬𝐞𝐫𝐚𝐬 𝐞𝐱𝐩𝐮𝐥𝐬𝐚𝐝𝐨/𝐚...!!`,
                mentions: [sender]
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    delete: msg.key
                });
            }
            catch (error) {
                console.error('Error eliminando mensaje:', error);
            }
            try {
                const response = await sock.groupParticipantsUpdate(msg.key.remoteJid, [sender], 'remove');
                if (response[0]?.status === '404') {
                    console.log('Usuario no encontrado en el grupo');
                }
            }
            catch (error) {
                console.error('Error eliminando usuario:', error);
            }
            return true;
        }
        catch (error) {
            console.error('Error en antilink event:', error);
            return false;
        }
    },
    getMessageText(msg) {
        try {
            if (msg.message?.conversation) {
                return msg.message.conversation;
            }
            if (msg.message?.extendedTextMessage?.text) {
                return msg.message.extendedTextMessage.text;
            }
            if (msg.message?.imageMessage?.caption) {
                return msg.message.imageMessage.caption;
            }
            if (msg.message?.videoMessage?.caption) {
                return msg.message.videoMessage.caption;
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
};
export default antilinkEvent;