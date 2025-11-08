import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default {
    name: 'translate',
    aliases: ['traducir', 'tr', 'trans'],
    category: 'innovation',
    description: 'Traduce texto a cualquier idioma con contexto usando Gemini AI',
    usage: '#translate [idioma] [texto] o responde a un mensaje',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text;

            if (args.length === 0 && !quotedText) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Traductor IA Avanzado*\n\n` +
                        `Uso:\n` +
                        `✿ #translate [idioma] [texto]\n` +
                        `✿ Responde a un mensaje con #translate [idioma]\n\n` +
                        `Ejemplos:\n` +
                        `• #translate inglés Hola cómo estás\n` +
                        `• #translate japanese I love programming\n` +
                        `• #translate francés Buenos días\n` +
                        `• #translate chinese 你好\n\n` +
                        `Soporta más de 100 idiomas con contexto cultural`
                });
            }

            if (!process.env.GEMINI_API_KEY) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ API Key de Gemini no configurada'
                });
            }

            let targetLang, textToTranslate;

            if (quotedText) {
                targetLang = args.join(' ');
                textToTranslate = quotedText;
            } else {
                targetLang = args[0];
                textToTranslate = args.slice(1).join(' ');
            }

            if (!textToTranslate) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No hay texto para traducir'
                });
            }

            await sock.sendMessage(chatId, {
                text: `《✧》 🌐 Traduciendo a ${targetLang}...`
            });

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const prompt = `Traduce el siguiente texto al ${targetLang}, manteniendo el tono, contexto y significado cultural. Si hay expresiones idiomáticas, adáptalas apropiadamente.

Texto a traducir:
"${textToTranslate}"

Responde SOLO con la traducción, sin explicaciones adicionales.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const translation = response.text();

            await sock.sendMessage(chatId, {
                text: `《✧》 *Traducción*\n\n` +
                    `🔤 *Original:*\n${textToTranslate}\n\n` +
                    `🌐 *${targetLang}:*\n${translation}\n\n` +
                    `_Traducción con contexto cultural por Gemini AI_`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en translate:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al traducir.\n\n` +
                    `Detalles: ${error.message}`
            });
        }
    }
};
