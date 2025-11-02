// Sistema de gestión de chats en memoria
const chats = new Map();

/**
 * Obtiene o crea un objeto de chat
 * @param {string} chatId - ID del chat
 * @returns {object} Objeto del chat
 */
export function ensureChat(chatId) {
    if (!chats.has(chatId)) {
        chats.set(chatId, {
            id: chatId,
            settings: {},
            data: {},
            stats: {
                messagesTotal: 0,
                commandsUsed: 0,
                lastActivity: Date.now()
            }
        });
    }
    return chats.get(chatId);
}

/**
 * Guarda los datos de un chat
 * @param {string} chatId - ID del chat
 * @param {object} data - Datos a guardar
 */
export function saveChat(chatId, data) {
    const chat = ensureChat(chatId);
    Object.assign(chat, data);
}

/**
 * Obtiene los datos de un chat
 * @param {string} chatId - ID del chat
 * @returns {object|null} Datos del chat o null si no existe
 */
export function getChat(chatId) {
    return chats.get(chatId) || null;
}

/**
 * Elimina un chat de la memoria
 * @param {string} chatId - ID del chat a eliminar
 */
export function deleteChat(chatId) {
    chats.delete(chatId);
}

/**
 * Obtiene todos los chats
 * @returns {Map} Mapa con todos los chats
 */
export function getAllChats() {
    return chats;
}

export default {
    ensureChat,
    saveChat,
    getChat,
    deleteChat,
    getAllChats
};