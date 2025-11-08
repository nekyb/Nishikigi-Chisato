import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const chatHistories = new Map();

export default {
    name: 'ai',
    aliases: ['gemini', 'gpt', 'chatai', 'askia'],
    category: 'innovation',
    description: 'Chatea con Gemini 2.0 Flash con memoria de conversación',
    usage: '#ai [pregunta] o #ai reset (para reiniciar conversación)',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Gemini 2.0 Flash AI*\n\n` +
                        `Uso:\n` +
                        `✿ #ai [pregunta] - Pregunta lo que quieras\n` +
                        `✿ #ai reset - Reinicia la conversación\n\n` +
                        `Ejemplos:\n` +
                        `• #ai explícame la teoría de la relatividad\n` +
                        `• #ai escribe un poema sobre el mar\n` +
                        `• #ai ayúdame con matemáticas\n\n` +
                        `💡 El bot recuerda tu conversación en este chat`
                });
            }

            if (!process.env.GEMINI_API_KEY) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ API Key de Gemini no configurada'
                });
            }

            if (args[0].toLowerCase() === 'reset') {
                chatHistories.delete(userId);
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ✅ Conversación reiniciada. Empecemos de nuevo!'
                });
            }

            const question = args.join(' ');

            await sock.sendMessage(chatId, {
                text: '《✧》 🤖 Pensando...'
            });

            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.0-flash-exp',
                systemInstruction: 'Eres un asistente útil, amigable y conocedor. Respondes en español de manera clara y concisa. Puedes ayudar con cualquier tema: educación, entretenimiento, tecnología, ciencia, y más. Sé creativo y útil.'
            });

            let chat = chatHistories.get(userId);
            
            if (!chat) {
                chat = model.startChat({
                    history: [],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.9,
                    }
                });
                chatHistories.set(userId, chat);
            }

            const result = await chat.sendMessage(question);
            const response = await result.response;
            const answer = response.text();

            if (answer.length > 4000) {
                const chunks = answer.match(/[\s\S]{1,3900}/g) || [];
                for (let i = 0; i < chunks.length; i++) {
                    await sock.sendMessage(chatId, {
                        text: `《✧》 *Gemini AI* (${i + 1}/${chunks.length})\n\n${chunks[i]}`
                    }, { quoted: i === 0 ? msg : undefined });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✧》 *Gemini AI*\n\n${answer}\n\n_Usa #ai reset para reiniciar la conversación_`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error en ai:', error);
            
            if (error.message?.includes('quota') || error.message?.includes('limit')) {
                await sock.sendMessage(chatId, {
                    text: '《✧》 ⚠️ Límite de uso de la API alcanzado.\n\n' +
                        'Intenta de nuevo en unos minutos.'
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ Error al procesar tu pregunta.\n\n` +
                        `Detalles: ${error.message}`
                });
            }
        }
    }
};
