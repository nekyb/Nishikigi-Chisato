import axios from 'axios';

const languageCodes = {
    "es": "Spanish",
    "en": "English",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi"
};

async function translate(text, targetLang = 'es', sourceLang = 'auto') {
    try {
        const response = await axios.get('https://api.mymemory.translated.net/get', {
            params: {
                q: text,
                langpair: `${sourceLang}|${targetLang}`
            }
        });

        if (response.data.responseStatus === 200) {
            return response.data.responseData.translatedText;
        } else {
            throw new Error('Error en la traducción');
        }
    } catch (error) {
        console.error('Error en traducción:', error);
        throw error;
    }
}

function detectLanguageCode(text) {
    // Códigos ISO comunes
    const commonCodes = {
        'español': 'es',
        'spanish': 'es',
        'ingles': 'en',
        'english': 'en',
        'frances': 'fr',
        'french': 'fr',
        'aleman': 'de',
        'german': 'de',
        'italiano': 'it',
        'italian': 'it',
        'portugues': 'pt',
        'portuguese': 'pt',
        'ruso': 'ru',
        'russian': 'ru',
        'japones': 'ja',
        'japanese': 'ja',
        'coreano': 'ko',
        'korean': 'ko',
        'chino': 'zh',
        'chinese': 'zh',
        'arabe': 'ar',
        'arabic': 'ar',
        'hindi': 'hi'
    };

    text = text.toLowerCase().trim();
    return commonCodes[text] || text;
}

export default {
    name: 'translate',
    aliases: ['tr', 'traducir', 'traduccion'],
    category: 'utility',
    description: 'Traduce texto a cualquier idioma',
    usage: '.tr [idioma] [texto]\nEjemplo: .tr en hola mundo\nIdiomas: es, en, fr, de, it, pt, ru, ja, ko, zh, ar, hi',
    cooldown: 3,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        try {
            // Verificar si hay texto para traducir
            if (args.length < 2) {
                return await sock.sendMessage(chatId, {
                    text: `❌ *Uso incorrecto*\n\n${this.usage}`
                }, { quoted: msg });
            }

            // Extraer idioma y texto
            const targetLang = detectLanguageCode(args[0]);
            const textToTranslate = args.slice(1).join(' ');

            // Validar idioma
            if (!languageCodes[targetLang]) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Idioma no soportado: ${args[0]}\n\nIdiomas disponibles:\n${Object.entries(languageCodes).map(([code, name]) => `- ${code} (${name})`).join('\n')}`
                }, { quoted: msg });
            }

            // Enviar reacción de procesamiento
            await sock.sendMessage(chatId, {
                react: {
                    text: '🔄',
                    key: msg.key
                }
            });

            // Realizar traducción
            const translatedText = await translate(textToTranslate, targetLang);

            // Construir respuesta
            const response = `🌐 *Traducción (${languageCodes[targetLang]})*\n\n` +
                           `✦ Original: ${textToTranslate}\n\n` +
                           `✦ Traducción: ${translatedText}`;

            // Enviar resultado
            await sock.sendMessage(chatId, {
                text: response
            }, { quoted: msg });

            // Actualizar reacción a completado
            await sock.sendMessage(chatId, {
                react: {
                    text: '✅',
                    key: msg.key
                }
            });

        } catch (error) {
            console.error('Error en comando translate:', error);
            
            // Enviar mensaje de error
            await sock.sendMessage(chatId, {
                text: '❌ Error al traducir el texto. Por favor intenta de nuevo.'
            }, { quoted: msg });

            // Actualizar reacción a error
            await sock.sendMessage(chatId, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            });
        }
    }
};