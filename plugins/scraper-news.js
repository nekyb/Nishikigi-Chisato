import axios from 'axios';

export default {
    name: 'news',
    aliases: ['noticias', 'noticia', 'headlines'],
    category: 'scraper',
    description: 'Obtiene las últimas noticias globales',
    usage: '#news [país/categoría]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const categories = ['general', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];
            const countries = {
                'us': '🇺🇸 Estados Unidos',
                'mx': '🇲🇽 México',
                'ar': '🇦🇷 Argentina',
                'es': '🇪🇸 España',
                'co': '🇨🇴 Colombia',
                'pe': '🇵🇪 Perú',
                'cl': '🇨🇱 Chile',
                'gb': '🇬🇧 Reino Unido'
            };

            if (args.length > 0 && args[0] === 'ayuda') {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Noticias Globales* 📰\n\n` +
                        `*Países disponibles:*\n` +
                        Object.entries(countries).map(([code, name]) => `• ${name} (#news ${code})`).join('\n') +
                        `\n\n*Categorías:*\n` +
                        categories.map(cat => `• ${cat}`).join('\n') +
                        `\n\nEjemplo: #news technology`
                });
            }

            let country = 'us';
            let category = 'general';
            
            if (args.length > 0) {
                const input = args[0].toLowerCase();
                if (countries[input]) {
                    country = input;
                } else if (categories.includes(input)) {
                    category = input;
                }
            }

            const apiKey = 'pub_63379a6e8bc7dfb8a0b1be2e4f47e8f4b6c8e';
            const response = await axios.get(
                `https://newsdata.io/api/1/news?apikey=${apiKey}&country=${country}&category=${category}&language=es`
            );

            if (!response.data || !response.data.results || response.data.results.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ No se encontraron noticias.\n\nIntenta con otra categoría o país.`
                });
            }

            const news = response.data.results.slice(0, 5);
            const countryName = countries[country] || '🌍 Global';
            let message = `《✧》 *Últimas Noticias* 📰\n`;
            message += `📍 ${countryName}\n`;
            message += `✩ Categoría: ${category}\n\n`;
            message += `━━━━━━━━━━━━━━━━━━\n\n`;

            news.forEach((article, index) => {
                const categoryEmoji = {
                    'technology': '💻',
                    'business': '💼',
                    'entertainment': '🎬',
                    'sports': '⚽',
                    'science': '🔬',
                    'health': '🏥',
                    'general': '📰'
                };

                const emoji = categoryEmoji[article.category?.[0]] || '📰';
                
                message += `${index + 1}. ${emoji} *${article.title}*\n`;
                
                if (article.description) {
                    const desc = article.description.length > 150 
                        ? article.description.substring(0, 150) + '...' 
                        : article.description;
                    message += `\n${desc}\n`;
                }
                
                if (article.source_id) {
                    message += `\n📡 Fuente: ${article.source_id}\n`;
                }
                
                if (article.pubDate) {
                    const date = new Date(article.pubDate);
                    message += `🕐 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
                }
                
                if (article.link) {
                    message += `🔗 ${article.link}\n`;
                }
                
                message += `\n━━━━━━━━━━━━━━━━━━\n\n`;
            });

            message += `_Usa #news ayuda para ver más opciones_\n`;
            message += `_Datos de NewsData.io_`;

            await sock.sendMessage(chatId, {
                text: message
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en news:', error);
            
            if (error.response?.status === 429) {
                await sock.sendMessage(chatId, {
                    text: `《✧》 ⏱️ Límite de consultas alcanzado.\n\n` +
                        `Espera unos minutos e intenta nuevamente.`
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ Error al obtener noticias.\n\n` +
                        `Intenta nuevamente en unos momentos.`
                });
            }
        }
    }
};
