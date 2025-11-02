/**
 * Obtiene el ID de usuario normalizado de un mensaje
 * @param {Object} msg - Objeto del mensaje
 * @returns {string} ID de usuario normalizado con @s.whatsapp.net
 */
/**
 * Normaliza un ID de usuario al formato estándar
 * @param {string} id - ID de usuario en cualquier formato
 * @returns {string} ID normalizado
 */
export function normalizeUserId(id) {
    if (!id) return '';
    const cleanId = id.split('@')[0];
    return cleanId + '@s.whatsapp.net';
}

export function getUserId(msg) {
    const userId = msg.key.participant || msg.key.remoteJid;
    return normalizeUserId(userId);
}

/**
 * Obtiene el ID del chat (grupo o privado)
 * @param {Object} msg - Objeto del mensaje
 * @returns {string} ID del chat
 */
export function getChatId(msg) {
    return msg.key.remoteJid;
}

/**
 * Verifica si un mensaje es de un grupo
 * @param {Object} msg - Objeto del mensaje
 * @returns {boolean} true si es un grupo
 */
export function isGroup(msg) {
    return msg.key.remoteJid.endsWith('@g.us');
}