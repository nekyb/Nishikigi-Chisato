import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pathToFileURL } from 'url';

class CommandHandler {
    constructor() {
        this.commands = new Map();
    }

    async loadCommands() {
        const pluginsPath = path.join(__dirname, '..', 'plugins');
        try {
            await this._loadCommandsFromDirectory(pluginsPath);
            console.log(`✅ Se cargaron ${this.commands.size} comandos exitosamente`);
            return this.commands;
        } catch (error) {
            console.error('❌ Error cargando comandos:', error);
            return this.commands;
        }
    }

    async _loadCommandsFromDirectory(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                console.warn(`⚠️ Directorio no encontrado: ${dirPath}`);
                return;
            }

            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    await this._loadCommandsFromDirectory(filePath);
                } else if (file.endsWith('.js') && !file.endsWith('.d.ts')) {
                    try {
                        const fileUrl = pathToFileURL(filePath).href;
                        const module = await import(fileUrl);
                        const command = module.default;

                        if (command && command.name && typeof command.execute === 'function') {
                            this.commands.set(command.name, command);
                            if (command.aliases && Array.isArray(command.aliases)) {
                                command.aliases.forEach((alias) => {
                                    this.commands.set(alias, command);
                                });
                            }
                            console.log(`📦 Comando cargado: ${command.name}${command.aliases ? ` (aliases: ${command.aliases.join(', ')})` : ''}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error cargando ${file}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error leyendo directorio:', error);
        }
    }

    async handleMessage(sock, message) {
        // Implementar el manejo de mensajes aquí
        // Este método será llamado por el serbot
        try {
            if (!message.message) return;
            
            const prefix = '#'; // O el prefijo que uses
            const body = message.message?.conversation || 
                        message.message?.imageMessage?.caption || 
                        message.message?.videoMessage?.caption ||
                        message.message?.extendedTextMessage?.text || '';

            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = this.commands.get(commandName);

            if (!command) return;

            await command.execute(sock, message, args);
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }
}

// Funciones auxiliares que seguirán siendo utilizadas
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function loadCommands() {
    const commands = new Map();
    const pluginsPath = path.join(__dirname, '..', 'plugins');
    try {
        await loadCommandsFromDirectory(pluginsPath, commands);
        console.log(`✅ Se cargaron ${commands.size} comandos exitosamente`);
        return commands;
    }
    catch (error) {
        console.error('❌ Error cargando comandos:', error);
        return commands;
    }
}
async function loadCommandsFromDirectory(dirPath, commands) {
    try {
        if (!fs.existsSync(dirPath)) {
            console.warn(`⚠️ Directorio no encontrado: ${dirPath}`);
            return;
        }
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                await loadCommandsFromDirectory(filePath, commands);
            }
            else if (file.endsWith('.js') && !file.endsWith('.d.ts')) {
                try {
                    const fileUrl = pathToFileURL(filePath).href;
                    const module = await import(fileUrl);
                    const command = module.default;
                    if (command && command.name && typeof command.execute === 'function') {
                        commands.set(command.name, command);
                        if (command.aliases && Array.isArray(command.aliases)) {
                            command.aliases.forEach((alias) => {
                                commands.set(alias, command);
                            });
                        }
                        console.log(`📦 Comando cargado: ${command.name}${command.aliases ? ` (aliases: ${command.aliases.join(', ')})` : ''}`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error cargando ${file}:`, error);
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Error leyendo directorio:', error);
    }
}
export async function reloadCommands() {
    console.log('🔄 Recargando comandos...');
    return await loadCommands();
}
export function getCommandInfo(commands, commandName) {
    return commands.get(commandName);
}
export function listCommandsByCategory(commands) {
    const categories = {
        admin: [],
        group: [],
        owner: [],
        general: [],
        fun: [],
        premium: []
    };
    const processedCommands = new Set();
    commands.forEach((command, name) => {
        if (processedCommands.has(command.name))
            return;
        processedCommands.add(command.name);
        const category = command.category || 'general';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(command.name);
    });
    return categories;
}
export function commandExists(commands, commandName) {
    return commands.has(commandName);
}
export function getAllCommandNames(commands) {
    const uniqueCommands = new Set();
    commands.forEach((command) => {
        uniqueCommands.add(command.name);
    });
    return Array.from(uniqueCommands);
}

// Exportar la clase CommandHandler como default
export default CommandHandler;