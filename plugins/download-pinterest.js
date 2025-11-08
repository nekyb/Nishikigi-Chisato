import axios from 'axios';
import googlethis from 'googlethis';

export default {
    name: 'pinterest',
    aliases: ['pin', 'pindl'],
    category: 'downloads',
    description: 'Busca y descarga imágenes de Pinterest',
    usage: '#pinterest [búsqueda]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Pinterest Image Search*\n\n` +
                        `Uso:\n` +
                        `✿ #pinterest [búsqueda]\n\n` +
                        `Ejemplos:\n` +
                        `• #pinterest aesthetic wallpapers\n` +
                        `• #pinterest cute cats\n` +
                        `• #pinterest interior design`
                });
            }

            const query = args.join(' ');
            
            await sock.sendMessage(chatId, {
                text: `《✧》 🔍 Buscando "${query}" en Pinterest...`
            });

            const searchQuery = `${query} site:pinterest.com`;
            const results = await googlethis.search(searchQuery, {
                page: 0,
                safe: false,
                additional_params: {
                    hl: 'es'
                }
            });

            if (!results.results || results.results.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No se encontraron resultados para tu búsqueda'
                });
            }

            const images = [];
            for (const result of results.results.slice(0, 5)) {
                if (result.favicons && result.favicons.length > 0) {
                    images.push(result.favicons[0]);
                }
            }

            if (images.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ No se encontraron imágenes'
                });
            }

            await sock.sendMessage(chatId, {
                text: `《✧》 *Pinterest - ${query}*\n\n` +
                    `📌 Encontradas ${images.length} imágenes\n` +
                    `⏳ Enviando...`
            });

            for (let i = 0; i < Math.min(images.length, 3); i++) {
                try {
                    await sock.sendMessage(chatId, {
                        image: { url: images[i] },
                        caption: `《✧》 Pinterest #${i + 1} - ${query}`
                    });
                } catch (imgError) {
                    console.error('Error enviando imagen:', imgError);
                }
            }

            await sock.sendMessage(chatId, {
                text: `《✧》 ✅ Imágenes enviadas correctamente`
            });

        } catch (error) {
            console.error('Error en pinterest:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Error al buscar en Pinterest.\n\n' +
                    'Intenta con otra búsqueda.'
            });
        }
    }
};
