import axios from 'axios';
const slapGifs = [
    'https://media.tenor.com/tWkit2dRC_AAAAAC/anime-slap.gif',
    'https://media.tenor.com/TQx6o1FpULkAAAAC/slap-anime.gif',
    'https://media.tenor.com/WHca6UonbPEAAAAC/anime-slap.gif',
    'https://media.tenor.com/qvE84RZHkkgAAAAC/slap-anime-slap.gif',
    'https://media.tenor.com/5dYKzoSPXT4AAAAC/anime-slap.gif',
    'https://media.tenor.com/Q7CO7-teB5sAAAAC/slap-mad.gif',
    'https://media.tenor.com/wkKrH9fPZ8oAAAAC/anime-slap.gif',
    'https://media.tenor.com/6dbs4bt3U9EAAAAC/anime-slap.gif'
];
const slapCommand = {
    name: 'slap',
    aliases: ['cachetada', 'bofetada'],
    category: 'fun',
    description: 'Dale una cachetada a otro usuario',
    usage: '#slap @usuario',
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
                    text: 'ᯓ★ Debes etiquetar a alguien para darle una cachetada.\nUso: #slap @usuario'
                }, { quoted: msg });
                return;
            }
            const targetUser = mentionedJid[0];
            if (targetUser === sender) {
                await sock.sendMessage(chatId, {
                    text: 'ᯓ★ No puedes abofetearte a ti mismo, eso dolería (╥﹏╥)'
                }, { quoted: msg });
                return;
            }
            const randomGif = slapGifs[Math.floor(Math.random() * slapGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            const caption = `@${sender.split('@')[0]} le dio una cachetada a @${targetUser.split('@')[0]} (╯°□°)╯︵ ┻━┻`;
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
            console.error('Error en comando slap:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al enviar la cachetada.'
            });
        }
    }
};
export default slapCommand;