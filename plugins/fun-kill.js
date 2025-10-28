import axios from 'axios';
const killGifs = [
    'https://media.tenor.com/RggZ4Z6z5U0AAAAC/anime-kill.gif',
    'https://media.tenor.com/VKs8OHUul_cAAAAC/anime-fight.gif',
    'https://media.tenor.com/YtP7oWPPS5QAAAAC/anime-kill.gif',
    'https://media.tenor.com/-YhV4n_c1uMAAAAC/anime-stab.gif',
    'https://media.tenor.com/kD1b8K7kzGQAAAAC/anime-kill.gif',
    'https://media.tenor.com/X8p0bF6EZLwAAAAC/anime-death.gif',
    'https://media.tenor.com/4BJXSfE_ZQMAAAAC/anime-kill.gif',
    'https://media.tenor.com/zHKTL9GuVsAAAAAC/anime-sword.gif'
];
const killCommand = {
    name: 'kill',
    aliases: ['matar'],
    category: 'fun',
    description: 'Mata a otro usuario',
    usage: '#kill @usuario',
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
                    text: 'ᯓ★ Debes etiquetar a alguien para matarlo.\nUso: #kill @usuario'
                }, { quoted: msg });
                return;
            }
            const targetUser = mentionedJid[0];
            if (targetUser === sender) {
                await sock.sendMessage(chatId, {
                    text: 'ᯓ★ No puedes matarte a ti mismo, si necesitas ayuda habla con alguien ಥ_ಥ'
                }, { quoted: msg });
                return;
            }
            const randomGif = killGifs[Math.floor(Math.random() * killGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            const caption = `@${sender.split('@')[0]} ha asesinado a @${targetUser.split('@')[0]} ☠️ (⌐■_■)–︻╦╤─`;
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
            console.error('Error en comando kill:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al enviar el asesinato.'
            });
        }
    }
};
export default killCommand;