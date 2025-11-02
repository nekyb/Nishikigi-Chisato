import { jidNormalizedUser } from '@whiskeysockets/baileys';
import alertasEvent from '../events/alertas.js';
import welcomeEvent from '../events/welcome.js';
import antiarabes from '../events/antiarab.js';

export async function handleEvents(sock, update, events) {
    try {
        const eventType = update.action || update.type;
        switch (eventType) {
            case 'add':
                await welcomeEvent.handleNewParticipants(sock, update);
                await alertasEvent.handleParticipantsUpdate(sock, update);
                break;
            case 'remove':
                await welcomeEvent.handleParticipantLeft(sock, update);
                await alertasEvent.handleParticipantsUpdate(sock, update);
                break;
            case 'promote':
                await alertasEvent.handleParticipantsUpdate(sock, update);
                break;
            case 'demote':
                await alertasEvent.handleParticipantsUpdate(sock, update);
                break;
            case 'group-update':
                await alertasEvent.handleGroupUpdate(sock, update);
                break;
            default:
                break;
        }
    }
    catch (error) {
        console.error('Error manejando evento:', error);
    }
}

export async function loadEvents() {
    const events = new Map();
    try {
        events.set('alertas', alertasEvent);
        events.set('welcome', welcomeEvent);
        console.log(`✅ Se cargaron ${events.size} eventos exitosamente`);
        return events;
    }
    catch (error) {
        console.error('❌ Error cargando eventos:', error);
        return events;
    }
}

export async function isUserAdmin(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(
            (p) => jidNormalizedUser(p.id) === jidNormalizedUser(userId)
        );
        return !!participant?.admin;
    }
    catch (error) {
        console.error('Error verificando si es admin:', error);
        return false;
    }
}

export async function isBotAdmin(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const botId = jidNormalizedUser(sock.user.id);
        const participant = groupMetadata.participants.find(
            (p) => jidNormalizedUser(p.id) === botId
        );
        return !!participant?.admin;
    }
    catch (error) {
        console.error('Error verificando si bot es admin:', error);
        return false;
    }
}

export async function getGroupOwner(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        return groupMetadata.owner || null;
    }
    catch (error) {
        console.error('Error obteniendo owner del grupo:', error);
        return null;
    }
}

export async function getGroupAdmins(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        return groupMetadata.participants
            .filter((p) => !!p.admin)
            .map((p) => p.id);
    }
    catch (error) {
        console.error('Error obteniendo admins del grupo:', error);
        return [];
    }
}

export async function getGroupParticipants(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        return groupMetadata.participants || [];
    }
    catch (error) {
        console.error('Error obteniendo participantes del grupo:', error);
        return [];
    }
}

export async function isUserInGroup(sock, groupId, userId) {
    try {
        const participants = await getGroupParticipants(sock, groupId);
        return participants.some((p) => jidNormalizedUser(p.id) === jidNormalizedUser(userId));
    }
    catch (error) {
        console.error('Error verificando si usuario está en grupo:', error);
        return false;
    }
}

export async function getGroupMetadata(sock, groupId) {
    try {
        return await sock.groupMetadata(groupId);
    }
    catch (error) {
        console.error('Error obteniendo metadata del grupo:', error);
        return null;
    }
}

export async function handleGroupPictureUpdate(sock, groupId) {
    try {
        await alertasEvent.handleGroupPictureUpdate(sock, groupId);
    }
    catch (error) {
        console.error('Error manejando actualización de foto:', error);
    }
}

export default {
    handleEvents,
    loadEvents,
    isUserAdmin,
    isBotAdmin,
    getGroupOwner,
    getGroupAdmins,
    getGroupParticipants,
    isUserInGroup,
    getGroupMetadata,
    handleGroupPictureUpdate
};