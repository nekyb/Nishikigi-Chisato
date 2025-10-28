import axios from 'axios';
const smokeGifs = [
    'https://i.pinimg.com/originals/73/47/19/7347192ae9916c177229ba972ccf8a68.gif',
    'https://i.pinimg.com/originals/27/34/4a/27344a307b56fabe9396e22a8357181e.gif',
    'https://i.pinimg.com/originals/29/92/fb/2992fb9c44cdc817e6cbc0782fbc6276.gif',
    'https://i.pinimg.com/originals/81/f1/a3/81f1a3448a3431bf18f2b9564f0d630d.gif',
    'https://i.pinimg.com/originals/3c/fd/7e/3cfd7efa3ca0d862694c32c1d7cc4e67.gif',
    'https://i.pinimg.com/originals/f0/1e/4b/f01e4b59c072d8857f22be2a6a9a55b9.gif',
    'https://i.pinimg.com/originals/d3/99/e0/d399e0a08bb3d42c54735147fab075fe.gif'
];
const smokeCommand = {
    name: 'smoke',
    aliases: ['fumar'],
    category: 'fun',
    description: 'Fuma en el chat',
    usage: '#smoke',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const sender = msg.sender;
        try {
            const randomGif = smokeGifs[Math.floor(Math.random() * smokeGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            const caption = `@${sender.split('@')[0]} está fumando 🚬 (˵ ͡° ͜ʖ ͡°˵)`;
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: caption,
                mentions: [sender],
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
            console.error('Error en comando smoke:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al enviar el cigarrillo.'
            });
        }
    }
};
export default smokeCommand;