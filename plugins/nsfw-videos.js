import fetch from 'node-fetch';
import { getGroupSettings } from '../database/users.js';

export default {
    name: 'randomvideo',
    aliases: ['rvid'],
    category: 'media',
    description: 'Envía un video aleatorio',
    usage: '#rvid',
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

            const videoListUrl = 'https://raw.githubusercontent.com/nekyb/Nishikigi-Chisato/refs/heads/main/database/porno.txt';
            const res = await fetch(videoListUrl);
            const text = await res.text();
            const urls = text.split('\n').filter(url => url.trim() !== '');
            
            if (urls.length === 0) {
                throw new Error('No hay videos disponibles');
            }

            const randomUrl = urls[Math.floor(Math.random() * urls.length)];
            
            await sock.sendMessage(chatId, {
                video: { url: randomUrl },
                caption: '🎬 *Video Aleatorio*\n\n_Contenido +18_'
            }, { quoted: msg });

            await sock.sendMessage(chatId, {
                react: { text: '✅', key: msg.key }
            });
        } catch (error) {
            console.error('Error en comando randomvideo:', error);
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });

            await sock.sendMessage(chatId, {
                text: '《✧》 ⚠️ Error al obtener el video.\n\n' +
                    '💡 *Tip:* Intenta de nuevo en unos momentos.'
            }, { quoted: msg });
        }
    }
};