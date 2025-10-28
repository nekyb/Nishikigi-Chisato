import { promises as fs } from 'fs';
import path from 'path';

const usersFilePath = path.join(process.cwd(), 'database', 'users.json');
const groupsFilePath = path.join(process.cwd(), 'database', 'groups.json');

async function ensureFile(filePath, defaultData = []) {
    try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        if (!content || content.trim() === '') {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        }
    } catch {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
}

async function loadUsers() {
    await ensureFile(usersFilePath);
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        if (!data || data.trim() === '') {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Error parseando users.json, recreando archivo:', error);
        await fs.writeFile(usersFilePath, JSON.stringify([], null, 2), 'utf-8');
        return [];
    }
}

async function saveUsers(users) {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}

async function loadGroups() {
    await ensureFile(groupsFilePath);
    try {
        const data = await fs.readFile(groupsFilePath, 'utf-8');
        if (!data || data.trim() === '') {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Error parseando groups.json, recreando archivo:', error);
        await fs.writeFile(groupsFilePath, JSON.stringify([], null, 2), 'utf-8');
        return [];
    }
}

async function saveGroups(groups) {
    await fs.writeFile(groupsFilePath, JSON.stringify(groups, null, 2), 'utf-8');
}

export async function registerUser(userData) {
    try {
        const users = await loadUsers();
        const existingUser = users.find(u => u.user_id === userData.userId);
        if (existingUser) {
            return false;
        }
        const newUser = {
            user_id: userData.userId,
            name: userData.name,
            registered_at: userData.registeredAt,
            is_banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        users.push(newUser);
        await saveUsers(users);
        return true;
    } catch (error) {
        console.error('Error en registerUser:', error);
        return false;
    }
}

export async function checkUserRegistered(userId) {
    try {
        const users = await loadUsers();
        return users.some(u => u.user_id === userId);
    } catch (error) {
        console.error('Error en checkUserRegistered:', error);
        return false;
    }
}

export async function getUser(userId) {
    try {
        const users = await loadUsers();
        return users.find(u => u.user_id === userId) || null;
    } catch (error) {
        console.error('Error en getUser:', error);
        return null;
    }
}

export async function isUserBanned(userId) {
    try {
        const user = await getUser(userId);
        return user?.is_banned || false;
    } catch (error) {
        console.error('Error en isUserBanned:', error);
        return false;
    }
}

export async function setBanStatus(userId, banned) {
    try {
        const users = await loadUsers();
        const userIndex = users.findIndex(u => u.user_id === userId);
        if (userIndex === -1) {
            return false;
        }
        users[userIndex].is_banned = banned;
        users[userIndex].updated_at = new Date().toISOString();
        await saveUsers(users);
        return true;
    } catch (error) {
        console.error('Error en setBanStatus:', error);
        return false;
    }
}

export async function getGroupSettings(groupId) {
    try {
        const groups = await loadGroups();
        let group = groups.find(g => g.group_id === groupId);
        if (!group) {
            return await createGroupSettings(groupId);
        }
        return group;
    } catch (error) {
        console.error('Error en getGroupSettings:', error);
        return null;
    }
}

export async function createGroupSettings(groupId) {
    try {
        const groups = await loadGroups();
        const newGroup = {
            group_id: groupId,
            alertas: true,
            antilink: false,
            welcome: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        groups.push(newGroup);
        await saveGroups(groups);
        return newGroup;
    } catch (error) {
        console.error('Error en createGroupSettings:', error);
        return null;
    }
}

export async function updateGroupSettings(groupId, settings) {
    try {
        const groups = await loadGroups();
        const groupIndex = groups.findIndex(g => g.group_id === groupId);
        if (groupIndex === -1) {
            return false;
        }
        groups[groupIndex] = {
            ...groups[groupIndex],
            ...settings,
            updated_at: new Date().toISOString()
        };
        await saveGroups(groups);
        return true;
    } catch (error) {
        console.error('Error en updateGroupSettings:', error);
        return false;
    }
}

export async function getAllUsers() {
    try {
        const users = await loadUsers();
        return users.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
    } catch (error) {
        console.error('Error en getAllUsers:', error);
        return [];
    }
}

export async function countUsers() {
    try {
        const users = await loadUsers();
        return users.length;
    } catch (error) {
        console.error('Error en countUsers:', error);
        return 0;
    }
}