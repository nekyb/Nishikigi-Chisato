import { promises as fs } from 'fs'
import path from 'path'

const usersFilePath = path.join(process.cwd(), 'database', 'users.json')
async function ensureUsersFile() {
    try {
        await fs.access(usersFilePath);
    } catch {
        await fs.mkdir(path.dirname(usersFilePath), { recursive: true })
        await fs.writeFile(usersFilePath, JSON.stringify([], null, 2), 'utf-8')
    }
}

async function loadUsers() {
    await ensureUsersFile();
    const data = await fs.readFile(usersFilePath, 'utf-8')
    return JSON.parse(data)
}

async function saveUsers(users) {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8')
}

export async function getUser(userId) {
    const users = await loadUsers();
    return users.find(u => u.user_id === userId)
}

export async function createUser(userId, name) {
    const users = await loadUsers();
    const existingUser = users.find(u => u.user_id === userId)
    if (existingUser) {
        return existingUser
    }
    const newUser = {
        user_id: userId,
        name: name,
        registered_at: new Date().toISOString(),
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
    users.push(newUser)
    await saveUsers(users)
    return newUser
}

export async function updateUser(userId, updates) {
    const users = await loadUsers();
    const userIndex = users.findIndex(u => u.user_id === userId)
    if (userIndex === -1) {
        return null
    }
    users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updated_at: new Date().toISOString()
    };
    await saveUsers(users)
    return users[userIndex]
}

export async function banUser(userId) {
    return await updateUser(userId, { is_banned: true })
}

export async function unbanUser(userId) {
    return await updateUser(userId, { is_banned: false })
}

export async function isUserBanned(userId) {
    const user = await getUser(userId)
    return user ? user.is_banned : false
}

export async function getAllUsers() {
    return await loadUsers()
}

export async function initializeTables() {
    try {
        await ensureUsersFile();
        console.log('✅ Archivo users.json inicializado correctamente')
    } catch (error) {
        // console.error('❌ Error al inicializar users.json:', error)
    }
}

export default {
    getUser,
    createUser,
    updateUser,
    banUser,
    unbanUser,
    isUserBanned,
    getAllUsers,
    initializeTables
}