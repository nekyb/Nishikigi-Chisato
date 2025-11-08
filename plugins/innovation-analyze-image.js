import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default {
    name: 'analyzeimage',
    aliases: ['analizar', 'visionai', 'describir'],
    category: 'innovation',
    description: 'Analiza imágenes con IA avanzada usando Gemini Vision',
    usage: '#analyzeimage [responde a una imagen] o #analyzeimage [pregunta]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = quotedMsg?.imageMessage || msg.message?.imageMessage;

            if (!imageMsg) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Análisis de Imagen con IA*\n\n` +
                        `Uso:\n` +
                        `1. Envía una imagen\n` +
                        `2. Responde con #analyzeimage [pregunta opcional]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #analyzeimage ¿qué ves en esta imagen?\n` +
                        `✿ #analyzeimage describe detalladamente\n` +
                        `✿ #analyzeimage identifica objetos`
                });
            }

            if (!process.env.GEMINI_API_KEY) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ API Key de Gemini no configurada.\n\n' +
                        'El administrador debe configurar GEMINI_API_KEY'
                });
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 🔍 Analizando imagen con Gemini Vision AI...'
            });

            const buffer = await sock.downloadMediaMessage(quotedMsg || msg);
            
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const prompt = args.length > 0 
                ? args.join(' ')
                : 'Analiza esta imagen en detalle. Describe qué ves, los objetos presentes, colores, emociones, contexto y cualquier detalle relevante. Sé descriptivo y preciso.';

            const imageParts = [
                {
                    inlineData: {
                        data: buffer.toString('base64'),
                        mimeType: 'image/jpeg'
                    }
                }
            ];

            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const analysis = response.text();

            await sock.sendMessage(chatId, {
                text: `《✧》 *Análisis de Imagen*\n\n${analysis}\n\n_Powered by Gemini 2.0 Flash_`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en analyzeimage:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al analizar la imagen.\n\n` +
                    `Detalles: ${error.message}`
            });
        }
    }
};
