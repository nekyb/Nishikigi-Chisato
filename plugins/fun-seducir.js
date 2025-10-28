import axios from 'axios';
const seduceGifs = [
    'https://media.tenor.com/qk3I_TD2OZMAAAAC/anime-flirt.gif',
    'https://media.tenor.com/O6NvKvq9pM4AAAAC/anime-seduce.gif',
    'https://media.tenor.com/iw-nNEB_GroAAAAC/anime-wink.gif',
    'https://media.tenor.com/Pq-H7Y3mxC8AAAAC/anime-flirt.gif',
    'https://media.tenor.com/jU2VBLXAeOkAAAAC/anime-wink.gif',
    'https://media.tenor.com/F5n5xJqGRl0AAAAC/anime-seduce.gif',
    'https://media.tenor.com/Y7Y3q4uL8OIAAAAC/anime-flirt.gif',
    'https://media.tenor.com/2J3pJsKQGHQAAAAC/anime-wink.gif'
];
const seduceCommand = {
    name: 'seduce',
    aliases: ['seducir'],
    category: 'fun',
    description: 'Seduce a otro usuario',
    usage: '#seduce @usuario',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const sender = msg.sender;
        try {
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentionedJid || mentionedJid.length === 0) {
                await sock.sendMessage(chatId, {
                    text: 'ᯓ★ Debes etiquetar a alguien para seducirlo.\nUso: #seduce @usuario'
                }, { quoted: msg });
                return;
            }
            const targetUser = mentionedJid[0];
            if (targetUser === sender) {
                await sock.sendMessage(chatId, {
                    text: 'ᯓ★ No puedes seducirte a ti mismo, eso es narcisismo (˵ ͡~ ͜ʖ ͡°˵)'
                }, { quoted: msg });
                return;
            }
            const randomGif = seduceGifs[Math.floor(Math.random() * seduceGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            const caption = `@${sender.split('@')[0]} está seduciendo a @${targetUser.split('@')[0]} (˵ ͡◕ ᴥ ͡◕˵)♡`;
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: caption,
                mentions: [sender, targetUser],
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363421377964290@newsletter",
                        newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                        serverMessageId: 1,
                    }
                }
            });
        }
        catch (error) {
            console.error('Error en comando seduce:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al enviar la seducción.'
            });
        }
    }
};
export default seduceCommand;