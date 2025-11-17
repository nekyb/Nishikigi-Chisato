
import { getGroupSettings, updateGroupSettings } from '../database/users.js';

export default {
    name: 'porn',
    alias: ['nsfw'],
    category: 'nsfw',
    desc: 'Activa o desactiva los comandos NSFW en el grupo',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const groupId = msg.key.remoteJid;
        const settings = await getGroupSettings(groupId);
        
        if (args[0] === 'on') {
            if (settings?.nsfwEnabled) {
                await sock.sendMessage(groupId, {
                    text: '❌ Los comandos NSFW ya están activados en este grupo.'
                }, { quoted: msg });
                return;
            }

            await updateGroupSettings(groupId, { nsfwEnabled: true });
            await sock.sendMessage(groupId, {
                text: `✅ *Comandos NSFW Activados*

🔞 Los comandos +18 han sido habilitados.

📋 Comandos disponibles:
- #himg - Imagen hentai aleatoria
- #hentaimages - Imagen hentai aleatoria
- #phdll [url] - Descarga videos de Pornhub

⚠️ Estos comandos solo funcionan en este grupo mientras estén activados.`
            }, { quoted: msg });
            return;
        }

        if (args[0] === 'off') {
            if (!settings?.nsfwEnabled) {
                await sock.sendMessage(groupId, {
                    text: '❌ Los comandos NSFW ya están desactivados en este grupo.'
                }, { quoted: msg });
                return;
            }

            await updateGroupSettings(groupId, { nsfwEnabled: false });
            await sock.sendMessage(groupId, {
                text: '✅ Comandos NSFW desactivados exitosamente.'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(groupId, {
            text: `❌ Uso incorrecto del comando.

📋 Comandos disponibles:
- .porn on - Activa comandos NSFW
- .porn off - Desactiva comandos NSFW

Estado actual: ${settings?.nsfwEnabled ? '✅ Activado' : '❌ Desactivado'}`
        }, { quoted: msg });
    }
};
