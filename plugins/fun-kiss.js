import axios from 'axios';
const kissGifs = [
    'https://i.pinimg.com/originals/ea/de/5b/eade5b83bc8764de3037fcab1f5e2dec.gif',
    'https://i.pinimg.com/originals/da/64/eb/da64eb02a04941d4eb31f173cc2c6c40.gif',
    'https://i.pinimg.com/originals/6c/05/e5/6c05e58405258b50711b84ac9db7441a.gif',
    'https://i.pinimg.com/originals/e3/4e/31/e34e31123f8f35d5c771a2d6a70bef52.gif',
    'https://i.pinimg.com/originals/56/0b/b3/560bb37b1596f48d93a76db4f87dc2f9.gif',
    'https://i.pinimg.com/originals/42/c3/85/42c3851fc31dc3434dfe5fa7e3463f1d.gif',
    'https://i.pinimg.com/originals/cf/d2/2d/cfd22dd39db5f07aac1c580debc3626d.gif',
    'https://i.pinimg.com/originals/6b/4b/1a/6b4b1aeec35403f13089dd844f674ed0.gif'
];
const kissCommand = {
    name: 'kiss',
    aliases: ['besar', 'beso'],
    category: 'fun',
    description: 'Besa a otro usuario',
    usage: '#kiss @usuario',
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
                    text: 'ᯓ★ Debes etiquetar a alguien para besarlo.\nUso: #kiss @usuario'
                }, { quoted: msg });
                return;
            }
            const targetUser = mentionedJid[0];
            if (targetUser === sender) {
                await sock.sendMessage(chatId, {
                    text: 'ᯓ★ No puedes besarte a ti mismo, eso sería raro (˵ ͡° ͜ʖ ͡°˵)'
                }, { quoted: msg });
                return;
            }
            const randomGif = kissGifs[Math.floor(Math.random() * kissGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            const caption = `@${sender.split('@')[0]} le ha dado un beso a @${targetUser.split('@')[0]} (˵ ͡~ ͜ʖ ͡°˵)ノ⌒♡*:・。.`;
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
            console.error('Error en comando kiss:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al enviar el beso.'
            });
        }
    }
};
export default kissCommand;