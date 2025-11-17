import axios from 'axios';
const hugGifs = [
    'https://media.tenor.com/vCEvFv2MoXUAAAAC/hug.gif',
    'https://media.tenor.com/PzVTz0e3YdgAAAAC/anime-hug.gif',
    'https://media.tenor.com/2R9bO-R70UAAAAAC/hug-anime.gif',
    'https://media.tenor.com/nN9rODNxS0gAAAAC/anime-hug-cuddle.gif',
    'https://media.tenor.com/8pv49dRUapAAAAAC/hug-anime-hug.gif',
    'https://media.tenor.com/KGTFhGFL8bEAAAAC/anime-love.gif',
    'https://media.tenor.com/e2-h3VWcr8AAAAAC/anime-hug-couple.gif',
    'https://media.tenor.com/zfDJPix1X7MAAAAC/anime-hug.gif'
];
const hugCommand = {
    name: 'hug',
    aliases: ['abrazar', 'abrazo'],
    category: 'fun',
    description: 'Abraza a otro usuario',
    usage: '#hug @usuario',
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
                    text: 'ᯓ★ Debes etiquetar a alguien para abrazarlo.\nUso: #hug @usuario'
                }, { quoted: msg });
                return;
            }
            const targetUser = mentionedJid[0];
            if (targetUser === sender) {
                await sock.sendMessage(chatId, {
                    text: 'ᯓ★ No puedes abrazarte a ti mismo, necesitas un amigo para eso (˵ ͡° ͜ʖ ͡°˵)'
                }, { quoted: msg });
                return;
            }
            const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            const caption = `@${sender.split('@')[0]} está abrazando a @${targetUser.split('@')[0]} ꉂ(˵˃ ᗜ ˂˵)`;
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
            console.error('Error en comando hug:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al enviar el abrazo.'
            });
        }
    }
};
export default hugCommand;