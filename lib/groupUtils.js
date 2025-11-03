/**
 * Utilidades para manejo de grupos y permisos
 */

/**
 * Verifica si el bot es administrador en un grupo
 * @param {Object} sock - Socket de WhatsApp
 * @param {string} groupId - ID del grupo
 * @returns {Promise<boolean>} true si el bot es admin
 */
export async function isBotAdmin(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const participant = groupMetadata.participants.find(p => p.id === botId);
        
        // @neoxr/baileys usa 'isAdmin' y 'isSuperAdmin' en lugar de 'admin'
        return participant?.isAdmin === true || participant?.isSuperAdmin === true;
    } catch (error) {
        console.error('Error verificando si el bot es admin:', error);
        return false;
    }
}

/**
 * Verifica si un usuario es administrador en un grupo
 * @param {Object} sock - Socket de WhatsApp
 * @param {string} groupId - ID del grupo
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si el usuario es admin
 */
export async function isUserAdmin(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === userId);
        
        // @neoxr/baileys usa 'isAdmin' y 'isSuperAdmin' en lugar de 'admin'
        return participant?.isAdmin === true || participant?.isSuperAdmin === true;
    } catch (error) {
        console.error('Error verificando si el usuario es admin:', error);
        return false;
    }
}

/**
 * Obtiene la lista de administradores de un grupo
 * @param {Object} sock - Socket de WhatsApp
 * @param {string} groupId - ID del grupo
 * @returns {Promise<string[]>} Array con los IDs de los administradores
 */
export async function getGroupAdmins(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        
        // @neoxr/baileys usa 'isAdmin' y 'isSuperAdmin' en lugar de 'admin'
        return groupMetadata.participants
            .filter(p => p.isAdmin === true || p.isSuperAdmin === true)
            .map(p => p.id);
    } catch (error) {
        console.error('Error obteniendo admins del grupo:', error);
        return [];
    }
}