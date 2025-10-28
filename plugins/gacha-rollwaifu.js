import { promises as fs } from 'fs';
const charactersFilePath = './src/database/characters.json';
const cooldowns = {};
async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error('❀ No se pudo cargar el archivo characters.json.');
    }
}
async function saveCharacters(characters) {
    try {
        await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
    }
    catch (error) {
        throw new Error('❀ No se pudo guardar el archivo characters.json.');
    }
}
const rollwaifuCommand = {
    name: 'rollwaifu',
    aliases: ['rw', 'ver'],
    category: 'gacha',
    description: 'Muestra un personaje aleatorio del gacha',
    usage: '#rw',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;
        const now = Date.now();
        if (cooldowns[userId] && now < cooldowns[userId]) {
            const remainingTime = Math.ceil((cooldowns[userId] - now) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            return await sock.sendMessage(chatId, {
                text: `《✧》Debes esperar *${minutes} minutos y ${seconds} segundos* para usar *#rw* de nuevo.`
            }, { quoted: msg });
        }
        try {
            const characters = await loadCharacters();
            const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
            const randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)];
            const statusMessage = randomCharacter.user
                ? `Reclamado por @${randomCharacter.user.split('@')[0]}`
                : 'Libre';
            const message = `❀ Nombre » *${randomCharacter.name}*
⚥ Género » *${randomCharacter.gender}*
✰ Valor » *${randomCharacter.value}*
♡ Estado » ${statusMessage}
■ Fuente » *${randomCharacter.source}*
✦ ID: *${randomCharacter.id}*`;
            const mentions = randomCharacter.user ? [randomCharacter.user] : [];
            await sock.sendMessage(chatId, {
                image: { url: randomImage },
                caption: message,
                mentions
            }, { quoted: msg });
            if (!randomCharacter.user) {
                await saveCharacters(characters);
            }
            cooldowns[userId] = now + 15 * 60 * 1000;
        }
        catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al cargar el personaje: ${error.message}`
            }, { quoted: msg });
        }
    }
};
export default rollwaifuCommand;