import { isBotAdmin, isUserAdmin } from '../lib/adminUtils.js';

// Store para trackear actividad (en producción, usar base de datos)
const messageActivity = new Map();

// Rate limiting: evitar múltiples llamadas simultáneas
const pendingRequests = new Map();

// Helper para esperar entre operaciones
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'fantasmas',
    aliases: ['ghosts', 'inactivos'],
    category: 'group',
    description: 'Muestra los miembros inactivos del grupo',
    usage: '#fantasmas [días]',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        // Verificar si ya hay una petición en proceso para este grupo
        if (pendingRequests.has(chatId)) {
            return await sock.sendMessage(chatId, {
                text: `《✧》 ⏳ Ya hay un análisis en proceso.\n\n` +
                    `Por favor espera a que termine.`
            });
        }
        
        pendingRequests.set(chatId, true);
        
        try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('👻 DEBUG [FANTASMAS]: Iniciando búsqueda');
            
            const days = parseInt(args[0]) || 7;
            console.log('📅 DEBUG: Días de inactividad:', days);
            
            // Mensaje inicial
            await sock.sendMessage(chatId, {
                text: `《✧》 🔍 Analizando actividad del grupo...\n\n` +
                    `⏱️ Buscando usuarios inactivos por más de ${days} días...\n` +
                    `⚠️ Esto puede tardar unos segundos...`
            });

            // Esperar un poco antes de obtener metadata
            await sleep(1500);
            
            let groupMetadata;
            let retries = 0;
            const maxRetries = 3;
            
            // Reintentar si falla por rate limit
            while (retries < maxRetries) {
                try {
                    groupMetadata = await sock.groupMetadata(chatId);
                    break;
                } catch (error) {
                    if (error.message === 'rate-overlimit') {
                        retries++;
                        if (retries < maxRetries) {
                            console.log(`⏳ Rate limit alcanzado, esperando... (intento ${retries}/${maxRetries})`);
                            await sleep(3000 * retries); // Espera incremental
                            continue;
                        }
                    }
                    throw error;
                }
            }
            
            if (!groupMetadata) {
                throw new Error('No se pudo obtener información del grupo');
            }
            
            const participants = groupMetadata.participants || [];
            console.log('👥 DEBUG: Total participantes:', participants.length);
            
            const ghosts = [];
            const activeUsers = [];
            
            // Obtener el store de mensajes del chat si existe
            const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
            const activeUserIds = new Set();
            
            // Intentar obtener mensajes del store interno de Baileys
            if (sock.store && sock.store.messages && sock.store.messages[chatId]) {
                const messages = Array.from(sock.store.messages[chatId].values());
                console.log('💬 DEBUG: Mensajes en store:', messages.length);
                
                messages.forEach(m => {
                    if (m.messageTimestamp * 1000 > cutoffTime) {
                        const userId = m.key.participant || m.key.remoteJid;
                        if (userId) {
                            activeUserIds.add(userId);
                        }
                    }
                });
            }
            
            // Verificar actividad trackeada en el Map
            const groupActivity = messageActivity.get(chatId) || new Map();
            groupActivity.forEach((timestamp, userId) => {
                if (timestamp > cutoffTime) {
                    activeUserIds.add(userId);
                }
            });
            
            console.log('✅ DEBUG: Usuarios activos encontrados:', activeUserIds.size);
            
            // Clasificar participantes
            for (const participant of participants) {
                const isAdmin = participant.admin === 'admin' || participant.admin === 'superadmin';
                const isActive = activeUserIds.has(participant.id);
                
                if (!isAdmin && !isActive) {
                    ghosts.push(participant);
                } else if (isActive) {
                    activeUsers.push(participant);
                }
            }
            
            console.log('👻 DEBUG: Fantasmas encontrados:', ghosts.length);
            console.log('✅ DEBUG: Usuarios activos:', activeUsers.length);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Esperar antes de enviar el resultado
            await sleep(1000);
            
            if (ghosts.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 ✨ *Sin Fantasmas*\n\n` +
                        `¡Excelente! Todos los miembros no-admin han sido activos ` +
                        `en los últimos ${days} días.\n\n` +
                        `📊 Estadísticas:\n` +
                        `✅ Usuarios activos: ${activeUsers.length}\n` +
                        `👥 Total participantes: ${participants.length}\n` +
                        `👑 Admins (exentos): ${participants.filter(p => p.admin).length}\n\n` +
                        `⚠️ *Nota:* La detección se basa en los mensajes rastreados desde que el bot inició.`
                }, { quoted: msg });
            }

            const ghostList = ghosts.map((p, i) => {
                const number = p.id.split('@')[0];
                return `${i + 1}. @${number}`;
            }).join('\n');

            const mentions = ghosts.map(p => p.id);

            let message = `《✧》 👻 *Fantasmas del Grupo*\n\n`;
            message += `📅 Inactivos por más de *${days} días*\n`;
            message += `👻 Total fantasmas: *${ghosts.length}*\n`;
            message += `✅ Usuarios activos: *${activeUserIds.size}*\n\n`;
            message += `━━━━━━━━━━━━━━━━━━\n\n`;
            message += `*Lista de Fantasmas:*\n${ghostList}\n\n`;
            message += `━━━━━━━━━━━━━━━━━━\n\n`;
            message += `💡 Usa *#kickfantasmas ${days}* para expulsarlos\n`;
            message += `⚠️ Los admins no son considerados fantasmas\n\n`;
            message += `📝 *Nota:* La detección se basa en mensajes rastreados desde que el bot inició.`;

            await sock.sendMessage(chatId, {
                text: message,
                mentions: mentions
            }, { quoted: msg });

        } catch (error) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ ERROR [FANTASMAS]:', error.message);
            console.error('📋 Stack:', error.stack);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            let errorMessage = `《✧》 ❌ Error al analizar fantasmas.\n\n`;
            
            if (error.message === 'rate-overlimit') {
                errorMessage += `⚠️ El bot está procesando demasiadas peticiones.\n` +
                    `Por favor espera 30 segundos e intenta nuevamente.`;
            } else {
                errorMessage += `Intenta nuevamente en unos momentos.`;
            }
            
            await sock.sendMessage(chatId, {
                text: errorMessage
            });
        } finally {
            // Liberar el lock después de un delay
            setTimeout(() => {
                pendingRequests.delete(chatId);
            }, 2000);
        }
    }
};

// Función para trackear actividad (llamar desde el handler de mensajes)
export function trackMessageActivity(chatId, userId) {
    if (!messageActivity.has(chatId)) {
        messageActivity.set(chatId, new Map());
    }
    const groupActivity = messageActivity.get(chatId);
    groupActivity.set(userId, Date.now());
}

// Función para limpiar actividad antigua (llamar periódicamente)
export function cleanOldActivity(daysToKeep = 30) {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    messageActivity.forEach((groupActivity, chatId) => {
        groupActivity.forEach((timestamp, userId) => {
            if (timestamp < cutoffTime) {
                groupActivity.delete(userId);
            }
        });
        
        if (groupActivity.size === 0) {
            messageActivity.delete(chatId);
        }
    });
    
    console.log('🧹 Limpieza de actividad completada');
}