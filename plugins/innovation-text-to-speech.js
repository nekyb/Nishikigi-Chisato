import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export default {
    name: 'tts',
    aliases: ['speak', 'voice', 'decir'],
    category: 'innovation',
    description: 'Convierte texto a voz usando Google TTS',
    usage: '#tts [texto]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Text to Speech*\n\n` +
                        `Uso: #tts [texto]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #tts Hola cómo estás\n` +
                        `✿ #tts Este es un mensaje de prueba\n\n` +
                        `Idiomas soportados: español, inglés, francés, alemán, y más`
                });
            }

            const text = args.join(' ');

            if (text.length > 200) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ El texto es demasiado largo (máximo 200 caracteres)'
                });
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 🎙️ Generando audio...'
            });

            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=${encodeURIComponent(text)}`;

            const response = await axios.get(ttsUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            await sock.sendMessage(chatId, {
                audio: response.data,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en tts:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al generar audio.\n\n` +
                    `Intenta con un texto más corto.`
            });
        }
    }
};
