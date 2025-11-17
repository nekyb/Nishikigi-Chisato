import fetch from 'node-fetch';
import { getGroupSettings } from '../database/users.js';

export default {
    name: 'boobs',
    aliases: ['tetas'],
    category: 'nsfw',
    description: 'Envía una imagen aleatoria de la API Delirius',
    usage: '#boobs',
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

            const apiUrl = 'https://api.delirius.store/nsfw/boobs';
            
            // La API devuelve directamente la imagen, no JSON
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Error de API: ${response.status}`);
            }

            // Obtener la imagen como buffer
            const imageBuffer = await response.buffer();

            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: '🔞 *Imagen NSFW*\n\n_Contenido +18_'
            }, { quoted: msg });

            await sock.sendMessage(chatId, {
                react: { text: '✅', key: msg.key }
            });

        } catch (error) {
            console.error('Error en comando boobs:', error);

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