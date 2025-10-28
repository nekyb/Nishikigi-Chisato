import { GoogleGenerativeAI } from '@google/generative-ai';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
const logger = pino({ level: 'silent' });

// ⚙️ CONFIGURACIÓN: Agrega todas tus API Keys de Gemini aquí
const GEMINI_API_KEYS = [
    'AIzaSyBt77r0sl4YDcBqQBjHIMxu9ZvbjbzVqrk',
    // 'TU_SEGUNDA_API_KEY_AQUI',
    // 'TU_TERCERA_API_KEY_AQUI',
    // Agrega más keys según necesites
];

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
            
            // Verificar si es una respuesta a una imagen
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
                        `💡 *Tip:* Puedes hacer cualquier pregunta sobre la imagen.\n\n` +
                        `📊 *API Keys disponibles:* ${GEMINI_API_KEYS.length}`
                });
            }
            
            const prompt = args.length > 0
                ? args.join(' ')
                : '¿Qué ves en esta imagen? Descríbela en detalle.';
            
            await sock.sendMessage(chatId, {
                text: `《✧》 Analizando imagen con Gemini Vision AI...\n\n⏳ Esto puede tardar unos segundos.\n🔑 Probando con ${GEMINI_API_KEYS.length} API key(s) disponible(s)...`
            });

            // Descargar la imagen
            try {
                const messageToDownload = msg.message?.imageMessage ? msg : {
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
            } catch (downloadError) {
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
            
            // Analizar con Gemini Vision (probando todas las API keys)
            let analysis = '';
            let usedKeyIndex = -1;
            let usedModel = '';
            
            try {
                const result = await analyzeWithGemini(imageBuffer, prompt);
                analysis = result.text;
                usedKeyIndex = result.keyIndex;
                usedModel = result.model;
            } catch (geminiError) {
                console.error('Error con Gemini Vision:', geminiError);
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al analizar la imagen con Gemini Vision.\n\n' +
                        '💡 *Posibles causas:*\n' +
                        `✿ Todas las API keys alcanzaron su límite\n` +
                        `✿ Imagen muy grande o formato no soportado\n` +
                        `✿ Servicio temporalmente no disponible\n` +
                        `✿ API keys inválidas o sin permisos\n\n` +
                        `🔑 API keys probadas: ${GEMINI_API_KEYS.length}\n` +
                        `❌ Error: ${geminiError.message || 'Desconocido'}`
                });
            }
            
            // Enviar el análisis
            const response = `╔═══《 GEMINI VISION AI 》═══╗\n` +
                `║\n` +
                `║ ✦ *Pregunta:* ${prompt}\n` +
                `║ ✦ *Modelo:* ${usedModel}\n` +
                `║ ✦ *API Key:* #${usedKeyIndex + 1} de ${GEMINI_API_KEYS.length}\n` +
                `║\n` +
                `╚═════════════════════════╝\n\n` +
                `*Análisis:*\n${analysis}`;
            
            await sock.sendMessage(chatId, {
                text: response
            }, { quoted: msg });
            
        } catch (error) {
            console.error('Error en comando vision:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Ocurrió un error inesperado al analizar la imagen.\n\n' +
                    '💡 *Tip:* Intenta con una imagen más pequeña o diferente.'
            });
        }
    }
};

async function analyzeWithGemini(imageBuffer, prompt) {
    // Lista de modelos Gemini Vision con nombres correctos de la API
    const models = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ];
    
    let lastError = null;
    
    // Probar cada API key
    for (let keyIndex = 0; keyIndex < GEMINI_API_KEYS.length; keyIndex++) {
        const apiKey = GEMINI_API_KEYS[keyIndex];
        console.log(`\n🔑 Probando API Key #${keyIndex + 1}...`);
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Probar cada modelo con esta API key
        for (const modelName of models) {
            try {
                console.log(`  └─ Intentando modelo: ${modelName}...`);
                
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        maxOutputTokens: 1024,
                        temperature: 0.4,
                    }
                });
                
                const imageParts = [{
                    inlineData: {
                        data: imageBuffer.toString('base64'),
                        mimeType: 'image/jpeg'
                    }
                }];
                
                const result = await model.generateContent([prompt, ...imageParts]);
                const response = await result.response;
                const text = response.text();
                
                if (!text || text.trim().length === 0) {
                    throw new Error(`${modelName} devolvió respuesta vacía`);
                }
                
                console.log(`  ✓ ¡ÉXITO! API Key #${keyIndex + 1} con modelo ${modelName}`);
                return {
                    text: text,
                    keyIndex: keyIndex,
                    model: modelName
                };
                
            } catch (error) {
                console.error(`  ✗ Falló: ${error.message}`);
                lastError = error;
                
                // Si el error es de quota o rate limit, probar siguiente key
                if (error.message.includes('quota') || 
                    error.message.includes('rate limit') || 
                    error.message.includes('429')) {
                    console.log(`  ⚠️  Límite alcanzado, probando siguiente API key...`);
                    break; // Salir del loop de modelos y probar siguiente key
                }
                
                // Si el error es 404, probar siguiente modelo con la misma key
                if (error.message.includes('404') || 
                    error.message.includes('not found')) {
                    continue; // Probar siguiente modelo
                }
                
                // Para otros errores, continuar con siguiente modelo
                continue;
            }
        }
    }
    
    // Si todas las API keys y modelos fallaron
    console.error(`\n❌ Todas las ${GEMINI_API_KEYS.length} API keys fallaron con todos los modelos`);
    throw lastError || new Error(`Todas las ${GEMINI_API_KEYS.length} API keys de Gemini Vision fallaron`);
}

export default visionCommand;