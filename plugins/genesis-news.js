import axios from 'axios'
import { load } from 'cheerio'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB147GA8T_Yw3YMChXocBL0W4qvIFYGw6o'

async function fetchLatestNews(query, lang = 'es') {
    try {
        // Google News URL
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}-${lang.toUpperCase()}&gl=${lang.toUpperCase()}&ceid=${lang.toUpperCase()}:${lang}`;
        
        const response = await axios.get(url);
        const $ = load(response.data, { xmlMode: true });
        
        const articles = [];
        $('item').slice(0, 5).each((i, item) => {
            const $item = $(item);
            articles.push({
                title: $item.find('title').text().trim(),
                description: $item.find('description').text().trim(),
                url: $item.find('link').text().trim(),
                publishedAt: $item.find('pubDate').text().trim()
            });
        });
        
        return articles;
    } catch (error) {
        console.error('Error obteniendo noticias:', error);
        throw error;
    }
}
async function summarizeNewsWithAI(articles) {
try {const newsText = articles.map((article, i) => {
return `${i + 1}. ${article.title}\n${article.description || ''}`}).join('\n\n')
const prompt = `Eres un asistente de noticias profesional. Analiza las siguientes noticias y genera un resumen conciso, informativo y fácil de leer.
Noticias:
${newsText}

Genera un resumen que:
- Use emojis relevantes para cada noticia
- Sea breve pero informativo (máximo 3 líneas por noticia)
- Destaque lo más importante
- Use lenguaje claro y profesional

Formato esperado:
🔹 [Título corto]: [Resumen breve]
`

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 800
                }
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        )

        return response.data.candidates?.[0]?.content?.parts?.[0]?.text || null
    } catch (error) {
        console.error('Error al resumir con IA:', error)
        return null}}

export default {
    name: 'news',
    aliases: ['noticias', 'headlines', 'noticia'],
    category: 'ai',
    description: 'Obtiene las últimas noticias y las resume con IA',
    usage: '.news [tema opcional]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        await sock.sendMessage(chatId, {
            react: {
                text: '📰',
                key: msg.key
            }
        });

        const query = args.join(' ') || 'mundo';
        try {
            const articles = await fetchLatestNews(query, 'es');
            if (articles.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '❌ No se encontraron noticias para ese tema. Intenta con otra búsqueda.'
                }, { quoted: msg });
            }

            const aiSummary = await summarizeNewsWithAI(articles);
            let response = `📰 *NOTICIAS DESTACADAS*${query !== 'mundo' ? ` - ${query.toUpperCase()}` : ''}\n\n`;
            if (aiSummary) {
                response += `${aiSummary}\n\n`;
            } else {
                articles.forEach((article, i) => {
                    response += `${i + 1}. *${article.title}*\n`;
                    if (article.description) {
                        response += `   ${article.description.substring(0, 100)}...\n`;
                    }
                    response += `   🔗 ${article.url}\n\n`;
                });
            }

            response += `\n_Actualizado: ${new Date().toLocaleTimeString('es-ES')}_`;
            response += `\n> _*Powered by DeltaByte*_`;
            await sock.sendMessage(chatId, {
                text: response
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en news command:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Error al obtener noticias. Por favor intenta de nuevo más tarde.'
            }, { quoted: msg });
        }
    }}