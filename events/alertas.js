import { getGroupSettings } from '../database/users.js';
export const alertasEvent = {
    name: 'alertas',
    enabled: true,
    async handleParticipantsUpdate(sock, update) {
        const { id: groupId, participants, action } = update;
        try {
            const settings = await getGroupSettings(groupId);
            if (!settings || !settings.alertas)
                return;
            const groupMetadata = await sock.groupMetadata(groupId);
            for (const participant of participants) {
                const userNumber = participant.split('@')[0];
                const userName = `@${userNumber}`;
                let alertMessage = '';
                switch (action) {
                    case 'add':
                        alertMessage = `《✧》 Un nuevo usuario se ha unido al grupo.\n✿ Usuario: ${userName}`;
                        break;
                    case 'remove':
                        const remover = update.actor || 'Desconocido';
                        const removerNumber = remover.split('@')[0];
                        alertMessage = `《✧》 El admin @${removerNumber} ha eliminado a ${userName}.`;
                        break;
                    case 'promote':
                        const promoter = update.actor || 'Desconocido';
                        const promoterNumber = promoter.split('@')[0];
                        alertMessage = `《✧》 El admin @${promoterNumber} ha promovido a ${userName} como administrador.`;
                        break;
                    case 'demote':
                        const demoter = update.actor || 'Desconocido';
                        const demoterNumber = demoter.split('@')[0];
                        alertMessage = `《✧》 El admin @${demoterNumber} ha removido a ${userName} como administrador.`;
                        break;
                    default:
                        return;
                }
                if (alertMessage) {
                    await sock.sendMessage(groupId, {
                        text: alertMessage,
                        mentions: [participant, update.actor].filter(Boolean)
                    });
                }
            }
        }
        catch (error) {
            console.error('Error en alertas event:', error);
        }
    },
    async handleGroupUpdate(sock, update) {
        const { id: groupId, subject, desc, announce } = update;
        try {
            const settings = await getGroupSettings(groupId);
            if (!settings || !settings.alertas)
                return;
            let alertMessage = '';
            if (subject) {
                alertMessage = `《✧》 El nombre del grupo ha sido cambiado.\n✿ Nuevo nombre: ${subject}`;
            }
            else if (desc !== undefined) {
                alertMessage = `《✧》 La descripción del grupo ha sido actualizada.\n✿ Nueva descripción: ${desc || 'Sin descripción'}`;
            }
            else if (announce !== undefined) {
                const status = announce ? 'solo administradores' : 'todos los participantes';
                alertMessage = `《✧》 Ahora ${status} pueden enviar mensajes.`;
            }
            if (alertMessage) {
                await sock.sendMessage(groupId, {
                    text: alertMessage
                });
            }
        }
        catch (error) {
            console.error('Error en alertas group update:', error);
        }
    },
    async handleGroupPictureUpdate(sock, groupId) {
        try {
            const settings = await getGroupSettings(groupId);
            if (!settings || !settings.alertas)
                return;
            const alertMessage = `《✧》 La foto del grupo ha sido actualizada.`;
            await sock.sendMessage(groupId, {
                text: alertMessage
            });
        }
        catch (error) {
            console.error('Error en alertas picture update:', error);
        }
    },
    async handleBotRemoved(sock, groupId) {
        try {
            console.log(`Bot removido del grupo: ${groupId}`);
        }
        catch (error) {
            console.error('Error en bot removed:', error);
        }
    }
};
export default alertasEvent;