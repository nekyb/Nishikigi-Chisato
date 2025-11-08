import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default {
    name: 'explaincode',
    aliases: ['explicar', 'explain', 'whatcode'],
    category: 'innovation',
    description: 'Explica qué hace un código usando IA',
    usage: '#explaincode [código] o responde a un mensaje con código',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text;

            let code;
            
            if (quotedText) {
                code = quotedText;
            } else if (args.length > 0) {
                code = args.join(' ');
            } else {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Explicador de Código IA*\n\n` +
                        `Uso:\n` +
                        `✿ #explaincode [código]\n` +
                        `✿ Responde a un mensaje con código usando #explaincode\n\n` +
                        `Ejemplo:\n` +
                        `#explaincode function suma(a, b) { return a + b; }`
                });
            }

            if (!process.env.GEMINI_API_KEY) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ API Key de Gemini no configurada'
                });
            }

            if (code.length > 3000) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ El código es demasiado largo (máximo 3000 caracteres)'
                });
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 🧠 Analizando código con Gemini AI...'
            });

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const prompt = `Analiza el siguiente código y explica:
1. ¿Qué hace este código?
2. ¿Cómo funciona paso a paso?
3. ¿En qué lenguaje de programación está escrito?
4. ¿Hay algo que se pueda mejorar?

Código:
\`\`\`
${code}
\`\`\`

Da una explicación clara y detallada en español, como si le explicaras a alguien que está aprendiendo a programar.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const explanation = response.text();

            if (explanation.length > 4000) {
                const chunks = explanation.match(/[\s\S]{1,3900}/g) || [];
                for (let i = 0; i < chunks.length; i++) {
                    await sock.sendMessage(chatId, {
                        text: `《✧》 *Explicación de Código* (${i + 1}/${chunks.length})\n\n${chunks[i]}`
                    }, { quoted: i === 0 ? msg : undefined });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✧》 *Explicación de Código*\n\n${explanation}\n\n_Powered by Gemini 2.0 Flash_`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error en explaincode:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al explicar el código.\n\n` +
                    `Detalles: ${error.message}`
            });
        }
    }
};
