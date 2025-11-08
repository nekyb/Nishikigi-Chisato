import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default {
    name: 'fixcode',
    aliases: ['arreglar', 'debugcode', 'corregir'],
    category: 'innovation',
    description: 'Encuentra y corrige errores en código usando IA',
    usage: '#fixcode [código con error]',
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
                    text: `《✧》 *Corrector de Código IA*\n\n` +
                        `Uso:\n` +
                        `✿ #fixcode [código con error]\n` +
                        `✿ Responde a un mensaje con código usando #fixcode\n\n` +
                        `Ejemplo:\n` +
                        `#fixcode if (x = 5) { console.log("error") }`
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
                text: '《✧》 🔧 Analizando y corrigiendo código...'
            });

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const prompt = `Analiza el siguiente código y:
1. Identifica todos los errores (sintaxis, lógica, mejores prácticas)
2. Explica qué está mal
3. Proporciona el código corregido
4. Explica los cambios realizados

Código a analizar:
\`\`\`
${code}
\`\`\`

Formato de respuesta:
**Errores encontrados:**
[Lista de errores]

**Código corregido:**
\`\`\`
[código corregido aquí]
\`\`\`

**Explicación de cambios:**
[explicación detallada]`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const analysis = response.text();

            if (analysis.length > 4000) {
                const chunks = analysis.match(/[\s\S]{1,3900}/g) || [];
                for (let i = 0; i < chunks.length; i++) {
                    await sock.sendMessage(chatId, {
                        text: `《✧》 *Análisis y Corrección* (${i + 1}/${chunks.length})\n\n${chunks[i]}`
                    }, { quoted: i === 0 ? msg : undefined });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✧》 *Análisis y Corrección de Código*\n\n${analysis}\n\n_Powered by Gemini 2.0 Flash_`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error en fixcode:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al analizar el código.\n\n` +
                    `Detalles: ${error.message}`
            });
        }
    }
};
