import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default {
    name: 'gencode',
    aliases: ['generarcodigo', 'code', 'codegen'],
    category: 'innovation',
    description: 'Genera código de programación con IA usando Gemini',
    usage: '#gencode [lenguaje] [descripción]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length < 2) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Generador de Código IA*\n\n` +
                        `Uso: #gencode [lenguaje] [descripción]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #gencode python una calculadora científica\n` +
                        `✿ #gencode javascript validador de emails con regex\n` +
                        `✿ #gencode java clase para manejar estudiantes\n` +
                        `✿ #gencode c++ algoritmo de ordenamiento rápido\n\n` +
                        `Lenguajes soportados: Python, JavaScript, Java, C++, C#, PHP, Ruby, Go, Rust, y más`
                });
            }

            if (!process.env.GEMINI_API_KEY) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ API Key de Gemini no configurada'
                });
            }

            const language = args[0].toLowerCase();
            const description = args.slice(1).join(' ');

            await sock.sendMessage(chatId, {
                text: `《✧》 💻 Generando código en ${language}...\n⏳ Esto puede tardar unos segundos...`
            });

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const prompt = `Genera código limpio, eficiente y bien comentado en ${language} que haga lo siguiente: ${description}

Requisitos:
1. Código funcional y completo
2. Comentarios explicativos en español
3. Buenas prácticas del lenguaje
4. Manejo de errores cuando sea necesario
5. Ejemplos de uso si es relevante

Responde SOLO con el código, sin explicaciones adicionales fuera del código.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const code = response.text();

            const codeFormatted = code.replace(/```(\w+)?\n?/g, '').trim();

            if (codeFormatted.length > 4000) {
                const chunks = codeFormatted.match(/[\s\S]{1,3900}/g) || [];
                for (let i = 0; i < chunks.length; i++) {
                    await sock.sendMessage(chatId, {
                        text: `《✧》 *Código Generado (Parte ${i + 1}/${chunks.length})*\n\n\`\`\`${language}\n${chunks[i]}\n\`\`\``
                    }, { quoted: i === 0 ? msg : undefined });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✧》 *Código Generado en ${language}*\n\n\`\`\`${language}\n${codeFormatted}\n\`\`\`\n\n_Powered by Gemini 2.0 Flash_`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error en gencode:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al generar código.\n\n` +
                    `Detalles: ${error.message}`
            });
        }
    }
};
