import { promises as fs } from 'fs';
const charactersFilePath = './src/database/characters.json';
async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error('No se pudo cargar el archivo characters.json.');
    }
}
const winfoCommand = {
    name: 'winfo',
    aliases: ['charinfo', 'waifuinfo'],
    category: 'gacha',
    description: 'Muestra información de un personaje',
    usage: '#winfo <nombre del personaje>',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        if (args.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '《✧》Debes especificar un personaje para ver su información.\n> Ejemplo » *#winfo Aika Sano*'
            }, { quoted: msg });
        }
        const characterName = args.join(' ').toLowerCase().trim();
        try {
            const characters = await loadCharacters();
            const character = characters.find((c) => c.name.toLowerCase() === characterName);
            if (!character) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》No se encontró el personaje *${characterName}*.`
                }, { quoted: msg });
            }
            const statusMessage = character.user
                ? `Reclamado por @${character.user.split('@')[0]}`
                : 'Libre';
            const message = `❀ Nombre » *${character.name}*\n⚥ Género » *${character.gender}*\n✰ Valor » *${character.value}*\n♡ Estado » ${statusMessage}\n■ Fuente » *${character.source}*\n✦ ID » *${character.id}*`;
            const mentions = character.user ? [character.user] : [];
            await sock.sendMessage(chatId, {
                text: message,
                mentions
            }, { quoted: msg });
        }
        catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al cargar la información del personaje: ${error.message}`
            }, { quoted: msg });
        }
    }
};
export default winfoCommand;