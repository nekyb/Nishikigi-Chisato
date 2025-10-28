import { promises as fs } from 'fs';
const charactersFilePath = './src/database/characters.json';
async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error('《✧》No se pudo cargar el archivo characters.json.');
    }
}
const topwaifusCommand = {
    name: 'topwaifus',
    aliases: ['waifustop', 'waifusboard'],
    category: 'gacha',
    description: 'Muestra el ranking de personajes por valor',
    usage: '#topwaifus [página]',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            const characters = await loadCharacters();
            const page = parseInt(args[0]) || 1;
            const itemsPerPage = 10;
            const sortedCharacters = characters.sort((a, b) => Number(b.value) - Number(a.value));
            const totalCharacters = sortedCharacters.length;
            const totalPages = Math.ceil(totalCharacters / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const charactersToShow = sortedCharacters.slice(startIndex, endIndex);
            let message = '❀ *Personajes con más valor:*\n\n';
            charactersToShow.forEach((character, index) => {
                message += `✰ ${startIndex + index + 1} » *${character.name}*\n`;
                message += `\t\t→ Valor: *${character.value}*\n`;
            });
            message += `\n> • Página *${page}* de *${totalPages}*.`;
            await sock.sendMessage(chatId, {
                text: message
            }, { quoted: msg });
        }
        catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al cargar los personajes: ${error.message}`
            }, { quoted: msg });
        }
    }
};
export default topwaifusCommand;