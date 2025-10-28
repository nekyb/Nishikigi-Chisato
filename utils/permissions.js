import { config } from '../config/bot.js';
import { isUserBanned } from '../database/users.js';

export function isOwner(numberOrJid) {
    const cleanNumber = numberOrJid.replace(/[^0-9]/g, '');
    const ownerClean = config.ownerNumber.replace(/[^0-9]/g, '');
    return cleanNumber === ownerClean;
}

export async function isUserAdmin(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const userNumber = userId.split('@')[0];
        
        const participant = groupMetadata.participants.find((p) => {
            const participantNumber = p.id.split('@')[0];
            return participantNumber === userNumber;
        });
        
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    }
    catch (error) {
        console.error('Error verificando si es admin:', error);
        return false;
    }
}

export async function isBotAdmin(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const botNumber = sock.user.id.split(':')[0];
        
        const participant = groupMetadata.participants.find((p) => {
            const participantNumber = p.id.split('@')[0];
            return participantNumber === botNumber;
        });
        
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    }
    catch (error) {
        console.error('Error verificando si bot es admin:', error);
        return false;
    }
}

export async function isSuperAdmin(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find((p) => p.id === userId);
        return participant?.admin === 'superadmin';
    }
    catch (error) {
        console.error('Error verificando si usuario es super admin:', error);
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

export async function isGroupOwner(sock, groupId, userId) {
    try {
        const owner = await getGroupOwner(sock, groupId);
        return owner === userId;
    }
    catch (error) {
        console.error('Error verificando si usuario es owner del grupo:', error);
        return false;
    }
}

export async function getGroupAdmins(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const admins = groupMetadata.participants
            .filter((p) => p.admin === 'admin' || p.admin === 'superadmin')
            .map((p) => p.id);
        return admins;
    }
    catch (error) {
        console.error('Error obteniendo admins del grupo:', error);
        return [];
    }
}

export async function canKickUser(sock, groupId, adminId, targetId) {
    try {
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (targetId === botJid) {
            return { canKick: false, reason: 'No puedo eliminarme a mí mismo' };
        }
        if (isOwner(targetId)) {
            return { canKick: false, reason: 'No puedo eliminar al owner del bot' };
        }
        const groupOwner = await getGroupOwner(sock, groupId);
        if (targetId === groupOwner) {
            return { canKick: false, reason: 'No puedo eliminar al owner del grupo' };
        }
        const targetIsAdmin = await isUserAdmin(sock, groupId, targetId);
        if (targetIsAdmin) {
            const adminIsOwner = isOwner(adminId);
            const adminIsGroupOwner = await isGroupOwner(sock, groupId, adminId);
            if (!adminIsOwner && !adminIsGroupOwner) {
                return { canKick: false, reason: 'Solo el owner puede eliminar a un administrador' };
            }
        }
        return { canKick: true };
    }
    catch (error) {
        console.error('Error verificando si se puede kickear usuario:', error);
        return { canKick: false, reason: 'Error al verificar permisos' };
    }
}

export async function canUseCommand(sock, msg, command) {
    const senderId = msg.key.participant || msg.key.remoteJid;
    const chatId = msg.key.remoteJid;
    const senderNumber = senderId.split('@')[0];
    const isGroup = chatId.endsWith('@g.us');
    try {
        if (await isUserBanned(senderNumber)) {
            return { canUse: false, reason: 'Usuario baneado' };
        }
        if (command.ownerOnly) {
            if (!isOwner(senderNumber)) {
                return { canUse: false, reason: config.messages.notOwner };
            }
        }
        if (command.groupOnly) {
            if (!isGroup) {
                return { canUse: false, reason: config.messages.notGroup };
            }
        }
        if (command.adminOnly) {
            if (!isGroup) {
                return { canUse: false, reason: config.messages.notGroup };
            }
            const userIsAdmin = await isUserAdmin(sock, chatId, senderId);
            const userIsOwner = isOwner(senderNumber);
            if (!userIsAdmin && !userIsOwner) {
                return { canUse: false, reason: config.messages.notAdmin };
            }
        }
        if (command.botAdminRequired) {
            if (!isGroup) {
                return { canUse: false, reason: config.messages.notGroup };
            }
            const botIsAdmin = await isBotAdmin(sock, chatId);
            if (!botIsAdmin) {
                return { canUse: false, reason: config.messages.notBotAdmin };
            }
        }
        return { canUse: true };
    }
    catch (error) {
        console.error('Error verificando permisos de comando:', error);
        return { canUse: false, reason: 'Error al verificar permisos' };
    }
}

export async function getUserPermissionLevel(sock, groupId, userId) {
    try {
        if (isOwner(userId)) {
            return 'owner';
        }
        if (await isGroupOwner(sock, groupId, userId)) {
            return 'superadmin';
        }
        if (await isUserAdmin(sock, groupId, userId)) {
            return 'admin';
        }
        return 'member';
    }
    catch (error) {
        console.error('Error obteniendo nivel de permiso:', error);
        return 'member';
    }
}

export async function isUserInGroup(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        return groupMetadata.participants.some((p) => p.id === userId);
    }
    catch (error) {
        console.error('Error verificando si usuario está en grupo:', error);
        return false;
    }
}

export async function checkPermissions(sock, groupId, userId) {
    try {
        const [userIsOwner, userIsGroupOwner, userIsSuperAdmin, userIsAdmin, botIsAdmin, permissionLevel] = await Promise.all([
            Promise.resolve(isOwner(userId)),
            isGroupOwner(sock, groupId, userId),
            isSuperAdmin(sock, groupId, userId),
            isUserAdmin(sock, groupId, userId),
            isBotAdmin(sock, groupId),
            getUserPermissionLevel(sock, groupId, userId)
        ]);
        return {
            isOwner: userIsOwner,
            isGroupOwner: userIsGroupOwner,
            isSuperAdmin: userIsSuperAdmin,
            isAdmin: userIsAdmin,
            isBotAdmin: botIsAdmin,
            level: permissionLevel
        };
    }
    catch (error) {
        console.error('Error verificando permisos múltiples:', error);
        return {
            isOwner: false,
            isGroupOwner: false,
            isSuperAdmin: false,
            isAdmin: false,
            isBotAdmin: false,
            level: 'member'
        };
    }
}

export default {
    isOwner,
    isUserAdmin,
    isBotAdmin,
    isSuperAdmin,
    isGroupOwner,
    getGroupOwner,
    getGroupAdmins,
    canKickUser,
    canUseCommand,
    getUserPermissionLevel,
    isUserInGroup,
    checkPermissions
};