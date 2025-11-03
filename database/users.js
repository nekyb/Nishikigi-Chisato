import { promises as fs } from 'fs'
import path from 'path'

const usersFilePath = path.join(process.cwd(), 'database', 'users.json')
const groupsFilePath = path.join(process.cwd(), 'database', 'groups.json')
const warningsFilePath = path.join(process.cwd(), 'database', 'warnings.json')

async function ensureFile(filePath, defaultData = []) {
    try {
        await fs.access(filePath)
        const content = await fs.readFile(filePath, 'utf-8')
        if (!content || content.trim() === '') {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8')
        }
    } catch {
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8')
    }
}

async function loadUsers() {
    await ensureFile(usersFilePath)
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8')
        if (!data || data.trim() === '') {
            return []
        }
        return JSON.parse(data)
    } catch (error) {
        console.error('Error parseando users.json, recreando archivo:', error)
        await fs.writeFile(usersFilePath, JSON.stringify([], null, 2), 'utf-8')
        return []
    }
}

async function saveUsers(users) {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8')
}

async function loadGroups() {
    await ensureFile(groupsFilePath)
    try {
        const data = await fs.readFile(groupsFilePath, 'utf-8')
        if (!data || data.trim() === '') {
            return []
        }
        return JSON.parse(data)
    } catch (error) {
        console.error('Error parseando groups.json, recreando archivo:', error)
        await fs.writeFile(groupsFilePath, JSON.stringify([], null, 2), 'utf-8')
        return []
    }
}

async function saveGroups(groups) {
    await fs.writeFile(groupsFilePath, JSON.stringify(groups, null, 2), 'utf-8')
}

async function loadWarnings() {
    await ensureFile(warningsFilePath, {})
    try {
        const data = await fs.readFile(warningsFilePath, 'utf-8')
        if (!data || data.trim() === '') {
            return {}
        }
        return JSON.parse(data)
    } catch (error) {
        console.error('Error parseando warnings.json, recreando archivo:', error)
        await fs.writeFile(warningsFilePath, JSON.stringify({}, null, 2), 'utf-8')
        return {}
    }
}

async function saveWarnings(warnings) {
    await fs.writeFile(warningsFilePath, JSON.stringify(warnings, null, 2), 'utf-8')
}

export async function registerUser(userData) {
    try {
        const users = await loadUsers();
        const existingUser = users.find(u => u.user_id === userData.userId)
        if (existingUser) {
            return false;
        }
        const newUser = {
            user_id: userData.userId,
            name: userData.name,
            registered_at: userData.registeredAt,
            is_banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            economy: {
                coins: 1000,
                bank: 0,
                last_daily: null,
                last_work: null,
                inventory: [],
                stats: {
                    commands_used: 0,
                    messages_sent: 0,
                    items_bought: 0,
                    items_sold: 0
                }
            },
            settings: {
                notifications: true,
                language: "es"
            },
            achievements: [],
            xp: {
                level: 1,
                current: 0,
                required: 100
            }
        };
        users.push(newUser)
        await saveUsers(users)
        return true
    } catch (error) {
        console.error('Error en registerUser:', error)
        return false
    }
}

export async function checkUserRegistered(userId) {
    try {
        const users = await loadUsers()
        return users.some(u => u.user_id === userId)
    } catch (error) {
        console.error('Error en checkUserRegistered:', error)
        return false
    }
}

export async function getUser(userId) {
    try {
        const users = await loadUsers()
        return users.find(u => u.user_id === userId) || null
    } catch (error) {
        console.error('Error en getUser:', error)
        return null
    }
}

export async function isUserBanned(userId) {
    try {
        const user = await getUser(userId)
        return user?.is_banned || false
    } catch (error) {
        console.error('Error en isUserBanned:', error)
        return false
    }
}

export async function setBanStatus(userId, banned) {
    try {
        const users = await loadUsers()
        const userIndex = users.findIndex(u => u.user_id === userId)
        if (userIndex === -1) {
            return false
        }
        users[userIndex].is_banned = banned
        users[userIndex].updated_at = new Date().toISOString()
        await saveUsers(users)
        return true
    } catch (error) {
        console.error('Error en setBanStatus:', error)
        return false
    }
}

export async function getGroupSettings(groupId) {
    try {
        const groups = await loadGroups()
        let group = groups.find(g => g.group_id === groupId)
        if (!group) {
            return await createGroupSettings(groupId)
        }
        return group
    } catch (error) {
        console.error('Error en getGroupSettings:', error)
        return null
    }
}

export async function createGroupSettings(groupId) {
    try {
        const groups = await loadGroups()
        const newGroup = {
            group_id: groupId,
            alertas: true,
            antilink: false,
            antinsfw: false,
            welcome: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        groups.push(newGroup)
        await saveGroups(groups)
        return newGroup;
    } catch (error) {
        console.error('Error en createGroupSettings:', error)
        return null
    }
}

export async function updateGroupSettings(groupId, settings) {
    try {
        const groups = await loadGroups()
        const groupIndex = groups.findIndex(g => g.group_id === groupId)
        if (groupIndex === -1) {
            return false
        }
        groups[groupIndex] = {
            ...groups[groupIndex],
            ...settings,
            updated_at: new Date().toISOString()
        }
        await saveGroups(groups)
        return true;
    } catch (error) {
        console.error('Error en updateGroupSettings:', error)
        return false;
    }
}

export async function getAllUsers() {
    try {
        const users = await loadUsers()
        return users.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime()
            const dateB = new Date(b.created_at || 0).getTime()
            return dateB - dateA
        });
    } catch (error) {
        console.error('Error en getAllUsers:', error)
        return []
    }
}

export async function countUsers() {
    try {
        const users = await loadUsers()
        return users.length
    } catch (error) {
        console.error('Error en countUsers:', error)
        return 0
    }
}

export async function updateUser(userId, updates) {
    try {
        const users = await loadUsers();
        const userIndex = users.findIndex(u => u.user_id === userId);
        if (userIndex === -1) return false;
        
        users[userIndex] = {
            ...users[userIndex],
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        await saveUsers(users);
        return users[userIndex];
    } catch (error) {
        console.error('Error en updateUser:', error);
        return false;
    }
}

export async function addCoins(userId, amount) {
    try {
        const users = await loadUsers()
        const userIndex = users.findIndex(u => u.user_id === userId)
        if (userIndex === -1) return false

        if (!users[userIndex].economy) {
            users[userIndex].economy = {
                coins: 0,
                bank: 0,
                last_daily: null,
                last_work: null,
                inventory: [],
                stats: {
                    commands_used: 0,
                    messages_sent: 0,
                    items_bought: 0,
                    items_sold: 0
                }
            }
        }

        users[userIndex].economy.coins = (users[userIndex].economy.coins || 0) + amount
        users[userIndex].updated_at = new Date().toISOString()
        await saveUsers(users)
        return users[userIndex].economy.coins
    } catch (error) {
        console.error('Error en addCoins:', error)
        return false
    }
}

export async function removeCoins(userId, amount) {
    try {
        const users = await loadUsers()
        const userIndex = users.findIndex(u => u.user_id === userId)
        if (userIndex === -1) return false

        if (!users[userIndex].economy || users[userIndex].economy.coins < amount) {
            return false
        }

        users[userIndex].economy.coins -= amount
        users[userIndex].updated_at = new Date().toISOString()
        await saveUsers(users)
        return users[userIndex].economy.coins
    } catch (error) {
        console.error('Error en removeCoins:', error)
        return false
    }
}

export async function updateUserStats(userId, stat, value = 1) {
    try {
        const users = await loadUsers()
        const userIndex = users.findIndex(u => u.user_id === userId)
        if (userIndex === -1) return false

        if (!users[userIndex].economy) {
            users[userIndex].economy = {
                coins: 0,
                bank: 0,
                last_daily: null,
                last_work: null,
                inventory: [],
                stats: {
                    commands_used: 0,
                    messages_sent: 0,
                    items_bought: 0,
                    items_sold: 0
                }
            }
        }

        if (!users[userIndex].economy.stats[stat]) {
            users[userIndex].economy.stats[stat] = 0
        }

        users[userIndex].economy.stats[stat] += value
        users[userIndex].updated_at = new Date().toISOString()
        await saveUsers(users)
        return users[userIndex].economy.stats[stat]
    } catch (error) {
        console.error('Error en updateUserStats:', error)
        return false
    }
}

// ============================================
// SISTEMA DE WARNINGS
// ============================================

/**
 * Actualiza las advertencias de un usuario en un grupo
 * @param {string} groupJid - ID del grupo
 * @param {string} userJid - ID del usuario
 * @param {number} warnings - Número de advertencias
 * @returns {Promise<boolean>}
 */
export async function updateGroupWarnings(groupJid, userJid, warnings) {
    try {
        const warningsData = await loadWarnings()
        
        if (!warningsData[groupJid]) {
            warningsData[groupJid] = {}
        }
        
        warningsData[groupJid][userJid] = {
            count: warnings,
            lastUpdate: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hora
        }
        
        await saveWarnings(warningsData)
        return true
    } catch (error) {
        console.error('Error en updateGroupWarnings:', error)
        return false
    }
}

/**
 * Obtiene las advertencias de un usuario en un grupo
 * @param {string} groupJid - ID del grupo
 * @param {string} userJid - ID del usuario
 * @returns {Promise<number>}
 */
export async function getGroupWarnings(groupJid, userJid) {
    try {
        const warningsData = await loadWarnings()
        
        if (!warningsData[groupJid] || !warningsData[groupJid][userJid]) {
            return 0
        }
        
        const userData = warningsData[groupJid][userJid]
        
        // Verificar si las advertencias expiraron
        if (new Date(userData.expiresAt) < new Date()) {
            await updateGroupWarnings(groupJid, userJid, 0)
            return 0
        }
        
        return userData.count || 0
    } catch (error) {
        console.error('Error en getGroupWarnings:', error)
        return 0
    }
}

/**
 * Limpia las advertencias expiradas
 * @returns {Promise<boolean>}
 */
export async function cleanExpiredWarnings() {
    try {
        const warningsData = await loadWarnings()
        const now = new Date()
        let hasChanges = false
        
        for (const groupJid in warningsData) {
            for (const userJid in warningsData[groupJid]) {
                const userData = warningsData[groupJid][userJid]
                
                if (new Date(userData.expiresAt) < now) {
                    delete warningsData[groupJid][userJid]
                    hasChanges = true
                }
            }
            
            // Eliminar grupos vacíos
            if (Object.keys(warningsData[groupJid]).length === 0) {
                delete warningsData[groupJid]
            }
        }
        
        if (hasChanges) {
            await saveWarnings(warningsData)
        }
        
        return true
    } catch (error) {
        console.error('Error en cleanExpiredWarnings:', error)
        return false
    }
}

/**
 * Obtiene todas las advertencias de un grupo
 * @param {string} groupJid - ID del grupo
 * @returns {Promise<Object>}
 */
export async function getAllGroupWarnings(groupJid) {
    try {
        const warningsData = await loadWarnings()
        return warningsData[groupJid] || {}
    } catch (error) {
        console.error('Error en getAllGroupWarnings:', error)
        return {}
    }
}

/**
 * Resetea todas las advertencias de un grupo
 * @param {string} groupJid - ID del grupo
 * @returns {Promise<boolean>}
 */
export async function resetGroupWarnings(groupJid) {
    try {
        const warningsData = await loadWarnings()
        delete warningsData[groupJid]
        await saveWarnings(warningsData)
        return true
    } catch (error) {
        console.error('Error en resetGroupWarnings:', error)
        return false
    }
}