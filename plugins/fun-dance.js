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
        const chatId = msg.key?.remoteJid;
        // sender puede venir como msg.sender o desde msg.key.participant / msg.key.remoteJid
        const sender = msg.sender || (msg.key && (msg.key.participant || msg.key.remoteJid)) || '';
        try {
            const randomGif = danceGifs[Math.floor(Math.random() * danceGifs.length)];
            const response = await axios.get(randomGif, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            // Depuración ligera para entender la forma de msg en caso de fallo
            try { console.debug && console.debug('dance plugin - sender/keys', { sender, participant: msg.key?.participant, remoteJid: msg.key?.remoteJid }); } catch (e) {}

            // Normalizar sender y extraer nombre de usuario sin usar split directamente sobre valores inciertos
            const senderId = sender ? String(sender) : '';
            const username = senderId ? senderId.replace(/@.*$/, '') : '';
            const mentionTag = username ? `@${username}` : '';
            const caption = mentionTag ? `${mentionTag} está bailando ♪┌|∵|┘♪ └|∵|┐♪` : `¡Alguien está bailando! ♪┌|∵|┘♪ └|∵|┐♪`;
            const mentions = senderId ? [senderId] : [];

            // Determinar cómo enviar el buffer para que se reproduzca como GIF en WhatsApp
            const contentType = response.headers?.['content-type'] || '';
            let messagePayload = {};

            if (contentType.includes('gif') || /\.gif(\?|$)/i.test(randomGif)) {
                // Enviar como video con gifPlayback para animación
                messagePayload = {
                    video: imageBuffer,
                    gifPlayback: true,
                    caption: caption,
                    mimetype: 'image/gif'
                };
            } else {
                // Fallback: enviar como documento (adjunto) indicando el mimetype
                const ext = contentType.includes('webp') ? 'webp' : 'gif';
                messagePayload = {
                    document: imageBuffer,
                    fileName: `dance.${ext}`,
                    caption: caption,
                    mimetype: contentType || `image/${ext}`
                };
            }

            if (mentions.length > 0) messagePayload.mentions = mentions;
            messagePayload.contextInfo = {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363421377964290@newsletter",
                    newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                    serverMessageId: 1,
                }
            };

            await sock.sendMessage(chatId, messagePayload);
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