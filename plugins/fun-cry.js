import axios from 'axios';
const cryGifs = [
    'https://i.pinimg.com/originals/c1/be/30/c1be3022e608a33db43ed06e629ae31a.gif',
    'https://i.pinimg.com/originals/9c/c9/a0/9cc9a05e21b99ee8bc4cd5d62901dc99.gif',
    'https://i.pinimg.com/originals/4d/9c/ef/4d9cef56c589d417ae779ba6b1c20c5b.gif',
    'https://i.pinimg.com/originals/6b/d7/38/6bd73801b4f4eff060238e39a523505f.gif',
    'https://i.pinimg.com/originals/1d/14/31/1d1431d43329a5d05ebaada7ee8b1547.gif',
    'https://i.pinimg.com/originals/3b/99/c3/3b99c394a306d04b8462f3ae781302bf.gif',
    'https://i.pinimg.com/originals/b9/01/6c/b9016c33357dc0589090e0d1eaf957e7.gif',
    'https://i.pinimg.com/originals/40/73/6b/40736b738fe7584ce5afe61e78312d7a.gif'
];
const cryCommand = {
    name: 'cry',
    aliases: ['llorar'],
    category: 'fun',
    description: 'Llora en el chat',
    usage: '#cry',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const sender = msg.sender;
        try {
            const randomGif = cryGifs[Math.floor(Math.random() * cryGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            const caption = `@${sender.split('@')[0]} está llorando (˵•́ ಎ •̀˵) ੭`;
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
            console.error('Error en comando cry:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al enviar el llanto.'
            });
        }
    }
};
export default cryCommand;