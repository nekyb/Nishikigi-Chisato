import { getGroupSettings, updateGroupSettings } from '../database/users.js';
import { antilinkEvent } from '../events/antilink.js';

export default {
    name: 'antilink',
    aliases: ['antienlace', 'nolink'],
    category: 'admin',
    description: 'Activa o desactiva la protección anti-links',
    usage: '#antilink [on/off/status]',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: true,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const settings = await getGroupSettings(chatId);
            
            // Status
            if (!args[0] || args[0] === 'status') {
                const isActive = settings?.antilink || false;
                
                await sock.sendMessage(chatId, {
                    text: `《✧》 📊 *Estado del Anti-Link*\n\n` +
                        `🔄 Estado: ${isActive ? '✅ Activado' : '❌ Desactivado'}\n\n` +
                        `⚙️ *Configuración:*\n` +
                        `- Advertencias máx: ${antilinkEvent.config.maxWarnings}\n` +
                        `- Delay de eliminación: ${antilinkEvent.config.deleteDelay}ms\n` +
                        `- Tiempo de reseteo: ${antilinkEvent.config.warnExpiration / 60000} min\n\n` +
                        `🔗 *Tipos de links bloqueados:*\n` +
                        `✿ Links de WhatsApp\n` +
                        `✿ Acortadores de URL\n` +
                        `✿ Links externos en general\n\n` +
                        `✅ *Whitelist:*\n` +
                        antilinkEvent.whitelist.map(site => `  • ${site}`).join('\n') + '\n\n' +
                        `📋 *Comandos:*\n` +
                        `• #antilink on - Activar\n` +
                        `• #antilink off - Desactivar\n` +
                        `• #antilink status - Ver estado`
                }, { quoted: msg });
                return;
            }

            // Activar
            if (args[0] === 'on') {
                if (settings?.antilink) {
                    return await sock.sendMessage(chatId, {
                        text: '《✧》 ❌ El anti-link ya está activado en este grupo.'
                    }, { quoted: msg });
                }

                await updateGroupSettings(chatId, { antilink: true });

                await sock.sendMessage(chatId, {
                    text: `《✧》 ✅ *Anti-Link Activado*\n\n` +
                        `🛡️ La protección contra links ha sido activada.\n\n` +
                        `📋 *Funciones:*\n` +
                        `✿ Detecta links de WhatsApp\n` +
                        `✿ Detecta acortadores de URL\n` +
                        `✿ Detecta links externos\n` +
                        `✿ Sistema de advertencias\n` +
                        `✿ Expulsión automática al exceder límite\n\n` +
                        `⚙️ *Configuración:*\n` +
                        `- Advertencias antes de expulsar: ${antilinkEvent.config.maxWarnings}\n` +
                        `- Admins están exentos del filtro\n` +
                        `- Links del propio grupo permitidos\n\n` +
                        `✅ *Whitelist automática:*\n` +
                        antilinkEvent.whitelist.map(site => `  • ${site}`).join('\n') + '\n\n' +
                        `_El bot debe ser administrador para funcionar_`
                }, { quoted: msg });
                return;
            }

            // Desactivar
            if (args[0] === 'off') {
                if (!settings?.antilink) {
                    return await sock.sendMessage(chatId, {
                        text: '《✧》 ❌ El anti-link ya está desactivado en este grupo.'
                    }, { quoted: msg });
                }

                await updateGroupSettings(chatId, { antilink: false });

                await sock.sendMessage(chatId, {
                    text: '《✧》 ✅ Anti-link desactivado exitosamente.\n\n' +
                        'Los usuarios ahora pueden enviar links libremente.'
                }, { quoted: msg });
                return;
            }

            // Comando inválido
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Uso incorrecto del comando.\n\n` +
                    `📋 *Comandos disponibles:*\n` +
                    `• #antilink on - Activar protección\n` +
                    `• #antilink off - Desactivar protección\n` +
                    `• #antilink status - Ver estado actual\n\n` +
                    `Ejemplo: #antilink on`
            });

        } catch (error) {
            console.error('Error en comando antilink:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Ocurrió un error al configurar el anti-link.'
            });
        }
    }
};
