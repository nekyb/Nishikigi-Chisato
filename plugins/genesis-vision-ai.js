import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
const logger = pino({ level: 'silent' });

const GEMINI_API_KEY = 'AIza...';
const CLOUDFLARE_ACCOUNT_ID = 'account-id';
const CLOUDFLARE_API_TOKEN = 'api-token';
const visionCommand = {
    name: 'vision',
    aliases: ['analyze', 'whatisthis', 'describe'],
    category: 'tools',
    description: 'Analiza imágenes con IA y responde preguntas sobre ellas',
    usage: '#vision [pregunta] (responder a imagen o enviar imagen con caption)',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            let imageBuffer = null;
            let imageMessage = msg.message?.imageMessage;
            if (!imageMessage && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                imageMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }
            if (!imageMessage) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Vision AI - Análisis de Imágenes* 《✧》\n\n` +
                        `Envía una imagen con tu pregunta o responde a una imagen.\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #vision ¿Qué ves en esta imagen?\n` +
                        `✿ #vision Describe esta foto en detalle\n` +
                        `✿ #vision ¿Qué emociones transmite?\n` +
                        `✿ #vision ¿Qué texto tiene esta imagen?\n` +
                        `✿ #vision ¿Cuántas personas hay?\n\n` +
                        `💡 *Tip:* Puedes hacer cualquier pregunta sobre la imagen.`
                });
            }
            const prompt = args.length > 0
                ? args.join(' ')
                : '¿Qué ves en esta imagen? Descríbela en detalle.';
            await sock.sendMessage(chatId, {
                text: '《✧》 Analizando imagen con IA...\n\n⏳ Esto puede tardar unos segundos.'
            });

            try {
                const messageToDownload = msg.message?.imageMessage ? msg :
                    {
                        message: {
                            imageMessage: msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
                        },
                        key: msg.message.extendedTextMessage.contextInfo.stanzaId ? {
                            remoteJid: msg.key.remoteJid,
                            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: msg.message.extendedTextMessage.contextInfo.participant
                        } : msg.key
                    };
                imageBuffer = await downloadMediaMessage(messageToDownload, 'buffer', {}, {
                    logger,
                    reuploadRequest: sock.updateMediaMessage
                });
            }
            catch (downloadError) {
                console.error('Error al descargar imagen:', downloadError);
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al descargar la imagen.\n\n' +
                        '💡 *Tip:* Intenta enviar la imagen nuevamente.'
                });
            }
            if (!imageBuffer) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo obtener la imagen.'
                });
            }
            let analysis = '';
            let usedProvider = 'Gemini Vision';
            try {
                analysis = await analyzeWithGemini(imageBuffer, prompt);
            }
            catch (geminiError) {
                console.error('Error con Gemini, intentando Cloudflare:', geminiError);
                try {
                    analysis = await analyzeWithCloudflare(imageBuffer, prompt);
                    usedProvider = 'Cloudflare AI';
                }
                catch (cloudflareError) {
                    console.error('Error con Cloudflare:', cloudflareError);
                    return await sock.sendMessage(chatId, {
                        text: '《✧》 Error al analizar la imagen.\n\n' +
                            '💡 *Posibles causas:*\n' +
                            `✿ Límite de API alcanzado\n` +
                            `✿ Imagen muy grande o corrupta\n` +
                            `✿ Servicio temporalmente no disponible\n\n` +
                            `Error: ${geminiError.message || 'Desconocido'}`
                    });
                }
            }
            // Enviar el análisis
            const response = `╔═══《 VISION AI 》═══╗\n` +
                `║\n` +
                `║ ✦ *Pregunta:* ${prompt}\n` +
                `║ ✦ *Proveedor:* ${usedProvider}\n` +
                `║\n` +
                `╚═════════════════╝\n\n` +
                `*Análisis:*\n${analysis}`;
            await sock.sendMessage(chatId, {
                text: response
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando vision:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Ocurrió un error inesperado al analizar la imagen.\n\n' +
                    '💡 *Tip:* Intenta con una imagen más pequeña o diferente.'
            });
        }
    }
};

async function analyzeWithGemini(imageBuffer, prompt) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const imageParts = [
        {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        }
    ];
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    if (!text) {
        throw new Error('Gemini no devolvió respuesta');
    }
    return text;
}

async function analyzeWithCloudflare(imageBuffer, prompt) {
    const imageData = new Uint8Array(imageBuffer);
    const imageArray = Array.from(imageData);
    const response = await axios.post(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`, {
        prompt: prompt,
        image: imageArray,
        max_tokens: 512
    }, {
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        timeout: 30000
    });
    const text = response.data?.result?.description;
    if (!text) {
        throw new Error('Cloudflare no devolvió respuesta válida');
    }
    return text;
}
export default visionCommand;
