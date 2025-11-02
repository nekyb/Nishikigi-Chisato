import { getGroupSettings } from '../database/users.js'

function normalizeJid(jid) {
    if (!jid) return null;
    // Eliminar cualquier sufijo adicional (como @lid)
    const cleanJid = jid.split('@')[0];
    return cleanJid + '@s.whatsapp.net';
}

export const alertasEvent = {
    name: 'alertas',
    enabled: true,
    async handleParticipantsUpdate(sock, update) {
        const { id: groupId, participants, action } = update
        try {
            const settings = await getGroupSettings(groupId)
            if (!settings || !settings.alertas)
                return;
            const groupMetadata = await sock.groupMetadata(groupId)
            for (const participant of participants) {
                const userNumber = participant.split('@')[0]
                const userName = `@${userNumber}`
                let alertMessage = ''

                // Obtener nombre del actor (admin)
                const actorId = update.actor ? normalizeJid(update.actor) : null;
                const actorName = actorId ? `@${actorId.split('@')[0]}` : ''

                switch (action) {
                    case 'add':
                        alertMessage = `《✧》 Un nuevo usuario se ha unido al grupo.\n✿ Usuario: ${userName}`
                        break
                    case 'remove':
                        alertMessage = actorName ? 
                            `《✧》 El admin ${actorName} ha eliminado a ${userName}.` :
                            `《✧》 ${userName} ha salido del grupo.`
                        break
                    case 'promote':
                        alertMessage = `《✧》 El admin ${actorName} ha promovido a ${userName} como administrador.`
                        break
                    case 'demote':
                        alertMessage = `《✧》 El admin ${actorName} ha removido a ${userName} como administrador.`
                        break
                    default:
                        return
                }
                if (alertMessage) {
                    // Normalizar las menciones
                    const mentions = [normalizeJid(participant)];
                    if (actorId) mentions.push(actorId);
                    
                    // Filtrar menciones nulas o inválidas
                    const validMentions = mentions.filter(Boolean);
                    
                    await sock.sendMessage(groupId, {
                        text: alertMessage,
                        mentions: validMentions
                    })
                }
            }
        } catch (error) {
            console.error('Error en alertas event:', error)
        }
    },

    async handleGroupUpdate(sock, update) {
        const { id: groupId, subject, desc, announce } = update
        try {
            const settings = await getGroupSettings(groupId)
            if (!settings || !settings.alertas)
                return
            let alertMessage = ''
            if (subject) {
                alertMessage = `《✧》 El nombre del grupo ha sido cambiado.\n✿ Nuevo nombre: ${subject}`
            } else if (desc !== undefined) {
                alertMessage = `《✧》 La descripción del grupo ha sido actualizada.\n✿ Nueva descripción: ${desc || 'Sin descripción'}`
            } else if (announce !== undefined) {
                const status = announce ? 'solo administradores' : 'todos los participantes'
                alertMessage = `《✧》 Ahora ${status} pueden enviar mensajes.`
            }
            if (alertMessage) {
                await sock.sendMessage(groupId, {
                    text: alertMessage
                })
            }
        } catch (error) {
            console.error('Error en alertas group update:', error)
        }
    },
    async handleGroupPictureUpdate(sock, groupId) {
        try {
            const settings = await getGroupSettings(groupId)
            if (!settings || !settings.alertas)
                return
            const alertMessage = `《✧》 La foto del grupo ha sido actualizada.`
            await sock.sendMessage(groupId, {
                text: alertMessage
            })
        } catch (error) {
            console.error('Error en alertas picture update:', error)
        }
    },
    async handleBotRemoved(sock, groupId) {
        try {
            console.log(`Bot removido del grupo: ${groupId}`)
        } catch (error) {
            console.error('Error en bot removed:', error)
        }
    }
}

export default alertasEvent