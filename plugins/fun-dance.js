import axios from 'axios';
const danceGifs = [
    'https://media.tenor.com/LNVNahJyrI0AAAAM/aharen-dance.gif',
    'https://media.tenor.com/_1NYmn8RuWAAAAAm/goku-fortnite-goku.webp',
    'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnZrMTA0YnBrZ282aWZyc3dxenR3OGt1OTlpcnY1aTkycmJ5eDZ4cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LML5ldpTKLPelFtBfY/giphy.webp',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnZrMTA0YnBrZ282aWZyc3dxenR3OGt1OTlpcnY1aTkycmJ5eDZ4cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/11lxCeKo6cHkJy/giphy.webp',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnZrMTA0YnBrZ282aWZyc3dxenR3OGt1OTlpcnY1aTkycmJ5eDZ4cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/eZq1NxT0vHRXa/200.webp',
    'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnZrMTA0YnBrZ282aWZyc3dxenR3OGt1OTlpcnY1aTkycmJ5eDZ4cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/a6pzK009rlCak/giphy.webp',
    'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnZrMTA0YnBrZ282aWZyc3dxenR3OGt1OTlpcnY1aTkycmJ5eDZ4cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/k7J8aS3xpmhpK/200w.webp',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnZrMTA0YnBrZ282aWZyc3dxenR3OGt1OTlpcnY1aTkycmJ5eDZ4cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/sFKyfExMBYWpSEbcml/200.webp'
];
const danceCommand = {
    name: 'dance',
    aliases: ['bailar', 'baile'],
    category: 'fun',
    description: 'Baila en el chat',
    usage: '#dance',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const sender = msg.sender;
        try {
            const randomGif = danceGifs[Math.floor(Math.random() * danceGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            const caption = `@${sender.split('@')[0]} está bailando ♪┌|∵|┘♪ └|∵|┐♪`;
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
            console.error('Error en comando dance:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al enviar el baile.'
            });
        }
    }
};
export default danceCommand;