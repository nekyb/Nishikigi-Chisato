
import fetch from 'node-fetch';
import { getGroupSettings } from '../database/users.js';

export default {
    name: 'hentaimages',
    aliases: ['himg'],
    category: 'nsfw',
    description: 'Envía una imagen hentai aleatoria',
    usage: '#himg',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        try {
            const settings = await getGroupSettings(chatId);
            
            if (!settings?.nsfwEnabled) {
                return await sock.sendMessage(chatId, {
                    text: '🔞 Los comandos NSFW están desactivados en este grupo.\n\n' +
                        'Un administrador debe activarlos con: .porn on'
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, {
                react: { text: '⏱', key: msg.key }
            });

            const hentaiUrl = 'https://raw.githubusercontent.com/nekyb/Nishikigi-Chisato/refs/heads/main/database/hentai.txt';
            const res = await fetch(hentaiUrl);
            const text = await res.text();
            
            const urls = text.split('\n').filter(url => url.trim() !== '');
            
            if (urls.length === 0) {
                throw new Error('No hay imágenes disponibles');
            }

            const randomUrl = urls[Math.floor(Math.random() * urls.length)];

            await sock.sendMessage(chatId, {
                image: { url: randomUrl },
                caption: '🔞 *Imagen Hentai*\n\n_Contenido +18_'
            }, { quoted: msg });

            await sock.sendMessage(chatId, {
                react: { text: '✅', key: msg.key }
            });

        } catch (error) {
            console.error('Error en comando hentaimages:', error);

            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });

            await sock.sendMessage(chatId, {
                text: '《✧》 ⚠️ Error al obtener la imagen.\n\n' +
                    '💡 *Tip:* Intenta de nuevo en unos momentos.'
            }, { quoted: msg });
        }
    }
};
