import axios from 'axios';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
async function generateImage(prompt) {
    try {
        const response = await axios.post(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`, { prompt }, {
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data);
    }
    catch (error) {
        console.error('Error generando imagen:', error);
        return null;
    }
}
const genesisCommand = {
    name: 'genesis',
    aliases: ['img', 'imagine', 'genimg'],
    category: 'tools',
    description: 'Genera una imagen usando IA a partir de un texto.',
    usage: '#genesis <descripción de la imagen>',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid || msg.chat;
        if (args.length === 0) {
            return sock.sendMessage(chatId, {
                text: '《✧》 Por favor, proporciona una descripción para generar la imagen.\n\n*Ejemplo:* #genesis un gato astronauta en el espacio'
            });
        }
        const prompt = args.join(' ');
        await sock.sendMessage(chatId, {
            text: '《✧》 Generando imagen, por favor espera...'
        });
        const imageBuffer = await generateImage(prompt);
        if (!imageBuffer) {
            return sock.sendMessage(chatId, {
                text: '《✧》 Error al generar la imagen. Por favor, intenta nuevamente.'
            });
        }
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `《✧》 *Imagen generada*\n\n📝 *Prompt:* ${prompt}`,
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
};
export default genesisCommand;