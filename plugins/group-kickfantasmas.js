import { isBotAdmin, isUserAdmin } from '../lib/adminUtils.js';

export default {
    name: 'kickfantasmas',
    aliases: ['kickghosts', 'limpieza', 'limpiar'],
    category: 'group',
    description: 'Expulsa a los miembros inactivos del grupo',
    usage: '#kickfantasmas [días]',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: true,


    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants || [];
            const days = parseInt(args[0]) || 7;
            const ghosts = [];
            const messages = await sock.fetchMessagesFromWA(chatId, 100).catch(() => []);
            console.log('💬 DEBUG: Mensajes obtenidos:', messages.length);
            const activeUserIds = new Set();
            const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
            if (messages && messages.length > 0) {
                messages.forEach(m => {
                    if (m.messageTimestamp > cutoffTime / 1000) {
                        const userId = m.key.participant || m.key.remoteJid;
                        if (userId) {
                            activeUserIds.add(userId);
                        }
                    }
                });
            }
            
            for (const participant of participants) {
                const isAdmin = participant.admin === 'admin' || participant.admin === 'superadmin';
                const isActive = activeUserIds.has(participant.id);
                if (!isAdmin && !isActive) {
                    ghosts.push(participant.id);
                }
            }
            
            if (ghosts.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✿》 *Sin Fantasmas*\n\n` +
                        `¡Excelente! No hay miembros inactivos ` +
                        `por más de ${days} días para expulsar.\n\n` +
                        `✅ El grupo está activo y saludable.`
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, {
                text: `《✿》*Advertencia*\n\n` +
                    `Se encontraron *${ghosts.length} fantasmas*\n\n` +
                    `🚨 Expulsando en 5 segundos...\n` +
                    `💡 Estos usuarios no han enviado mensajes ` +
                    `en ${days} días`
            });

            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log('✦ Iniciando purga!!!!');
            let kicked = 0;
            let failed = 0;
            for (let i = 0; i < ghosts.length; i += 5) {
                const batch = ghosts.slice(i, i + 5);
                try {
                    console.log(`📤 DEBUG: Expulsando lote ${Math.floor(i/5) + 1}...`);
                    const result = await sock.groupParticipantsUpdate(
                        chatId,
                        batch,
                        'remove'
                    );
                    
                    result.forEach(r => {
                        if (r.status === '200') kicked++;
                        else failed++;
                    });
                    
                    if (i + 5 < ghosts.length) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    
                } catch (error) {
                    console.error(`❌ ERROR en lote ${Math.floor(i/5) + 1}:`, error.message);
                    failed += batch.length;
                }
            }

            let resultMsg = `《✿》*Limpieza Completada*\n\n`;
            resultMsg += `✦ *Resultados:*\n`;
            resultMsg += `✦ Expulsados: *${kicked}*\n`;
            if (failed > 0) {
                resultMsg += `✦ Fallos: *${failed}*\n`;
            }
            
            resultMsg += `\n💡 El grupo ha sido limpiado de usuarios ` +
                `inactivos por más de ${days} días.`;
            await sock.sendMessage(chatId, {
                text: resultMsg
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `《✿》Error al expulsar fantasmas.\n\n` +
                    `Verifica que el bot tenga permisos de admin.`
            });
        }
    }
};
