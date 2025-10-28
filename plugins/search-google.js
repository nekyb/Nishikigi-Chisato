import { search } from 'googlethis';
const googleCommand = {
    name: 'google',
    aliases: ['ggl', 'search', 'buscar'],
    category: 'utils',
    description: 'Busca información en Google',
    usage: '#google [texto a buscar]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #google clima hoy\n` +
                        `✿ #ggl recetas de pizza\n` +
                        `✿ #google inteligencia artificial`
                });
            }
            const query = args.join(' ');
            await sock.sendMessage(chatId, {
                text: `《✧》 Buscando en Google: "${query}"...`
            });
            const options = {
                page: 0,
                safe: false,
                parse_ads: false,
                additional_params: {
                    hl: 'es'
                }
            };
            const results = await search(query, options);
            if (!results || !results.results || results.results.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 No se encontraron resultados para: "${query}"`
                });
            }
            const topResults = results.results.slice(0, 5);
            let responseText = `《✧》 *Resultados de Google*\n\n`;
            responseText += `🔍 Búsqueda: *${query}*\n`;
            responseText += `📊 Resultados encontrados: ${results.results.length}\n\n`;
            responseText += `─────────────────\n\n`;
            if (results.knowledge_panel) {
                const kp = results.knowledge_panel;
                responseText += `📌 *${kp.title || 'Información destacada'}*\n`;
                if (kp.type)
                    responseText += `Tipo: ${kp.type}\n`;
                if (kp.description) {
                    const shortDesc = kp.description.length > 200
                        ? kp.description.substring(0, 200) + '...'
                        : kp.description;
                    responseText += `${shortDesc}\n`;
                }
                responseText += `\n─────────────────\n\n`;
            }

            topResults.forEach((result, index) => {
                responseText += `${index + 1}. *${result.title}*\n`;
                if (result.description) {
                    const shortDesc = result.description.length > 150
                        ? result.description.substring(0, 150) + '...'
                        : result.description;
                    responseText += `   ${shortDesc}\n`;
                }
                responseText += `   🔗 ${result.url}\n\n`;
            });

            if (results.people_also_search && Array.isArray(results.people_also_search) && results.people_also_search.length > 0) {
                responseText += `─────────────────\n\n`;
                responseText += `🔎 *Búsquedas relacionadas:*\n`;
                results.people_also_search.slice(0, 4).forEach((related) => {
                    responseText += `• ${related.title}\n`;
                });
            }
            responseText += `\n─────────────────\n`;
            responseText += `_Resultados obtenidos de Google_`;
            await sock.sendMessage(chatId, {
                text: responseText
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando google:', error);
            let errorMessage = '《✧》 Error al realizar la búsqueda en Google.';
            if (error.message?.includes('timeout')) {
                errorMessage = '《✧》 La búsqueda tardó demasiado. Intenta de nuevo.';
            }
            else if (error.message?.includes('network')) {
                errorMessage = '《✧》 Error de conexión. Verifica tu internet.';
            }
            else if (error.message?.includes('rate limit')) {
                errorMessage = '《✧》 Demasiadas búsquedas. Espera un momento.';
            }
            else if (error.message?.includes('blocked')) {
                errorMessage = '《✧》 Google bloqueó la solicitud. Intenta más tarde.';
            }
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Intenta con palabras clave más específicas.`
            });
        }
    }
};
export default googleCommand;