import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.resolve(__dirname, '../database/users.json');
export async function loadUsers() {
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        return {};
    }
}

export async function saveUsers(users) {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}
