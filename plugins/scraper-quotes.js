import axios from 'axios';

export default {
    name: 'quote',
    aliases: ['cita', 'frase', 'quotes'],
    category: 'scraper',
    description: 'Obtiene citas inspiradoras y frases célebres',
    usage: '#quote [categoría]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            const categories = [
                'inspirational', 'success', 'life', 'love', 'happiness',
                'motivation', 'wisdom', 'friendship', 'faith', 'hope'
            ];

            const categoriesSpanish = {
                'inspirational': 'inspiracional',
                'success': 'éxito',
                'life': 'vida',
                'love': 'amor',
                'happiness': 'felicidad',
                'motivation': 'motivación',
                'wisdom': 'sabiduría',
                'friendship': 'amistad',
                'faith': 'fe',
                'hope': 'esperanza'
            };

            if (args.length > 0 && args[0] === 'categorias') {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Categorías Disponibles* 💭\n\n` +
                        categories.map((cat, i) => `${i + 1}. ${cat} (${categoriesSpanish[cat]})`).join('\n') +
                        `\n\nUso: #quote [categoría]\n` +
                        `Ejemplo: #quote motivation`
                });
            }

            let category = 'inspirational';
            if (args.length > 0) {
                const input = args[0].toLowerCase();
                if (categories.includes(input)) {
                    category = input;
                }
            }

            const response = await axios.get(`https://api.api-ninjas.com/v1/quotes?category=${category}`, {
                headers: { 'X-Api-Key': 'YOUR_API_KEY' }
            });

            let quote;
            if (!response.data || response.data.length === 0) {
                const fallbackResponse = await axios.get('https://zenquotes.io/api/random');
                const fallback = fallbackResponse.data[0];
                quote = {
                    quote: fallback.q,
                    author: fallback.a,
                    category: 'random'
                };
            } else {
                quote = response.data[0];
            }

            const translateResponse = await axios.post(
                'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=' + 
                encodeURIComponent(quote.quote)
            );
            
            const translatedQuote = translateResponse.data[0][0][0];
            const categoryEmoji = {
                'inspirational': '✨',
                'success': '🏆',
                'life': '🌟',
                'love': '❤️',
                'happiness': '😊',
                'motivation': '💪',
                'wisdom': '🧠',
                'friendship': '🤝',
                'faith': '🙏',
                'hope': '🌈',
                'random': '💭'
            };

            const emoji = categoryEmoji[quote.category] || '💭';
            const categoryInSpanish = categoriesSpanish[quote.category] || quote.category;
            const message = `《✧》 *Frase del Día* ${emoji}\n\n` +
                `"${translatedQuote}"\n\n` +
                `— *${quote.author}*\n\n` +
                `✦ Categoría: ${categoryInSpanish}\n\n` +
                `_Usa #quote categorias para ver más opciones_`;
            await sock.sendMessage(chatId, {
                text: message
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en quote:', error);
            try {
                const fallbackResponse = await axios.get('https://zenquotes.io/api/random');
                const fallback = fallbackResponse.data[0];
                const translateResponse = await axios.post(
                    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=' + 
                    encodeURIComponent(fallback.q)
                );
                
                const translatedFallback = translateResponse.data[0][0][0];
                await sock.sendMessage(chatId, {
                    text: `《✿》 *Frase del Día* 💭\n\n` +
                        `"${translatedFallback}"\n\n` +
                        `— *${fallback.a}*\n\n` +
                        `_Inspiración diaria_`
                }, { quoted: msg });
            } catch (fallbackError) {
                await sock.sendMessage(chatId, {
                    text: `《✿》Error al obtener la frase.\n\n` +
                        `Intenta nuevamente en unos momentos.`
                });
            }
        }
    }
};