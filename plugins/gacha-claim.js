import { promises as fs } from 'fs';
const charactersFilePath = './src/database/characters.json';
const cooldowns = {};
async function loadCharacters() {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
}
async function saveCharacters(characters) {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
}
const claimCommand = {
    name: 'claim',
    aliases: ['c', 'reclamar'],
    category: 'gacha',
    description: 'Reclama un personaje citando el mensaje',
    usage: '#claim (cita el mensaje del personaje)',
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
                text: `《✧》Debes esperar *${minutes} minutos y ${seconds} segundos* para usar *#c* de nuevo.`
            }, { quoted: msg });
        }
        if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            return await sock.sendMessage(chatId, {
                text: '《✧》Debes citar un personaje válido para reclamar.'
            }, { quoted: msg });
        }
        try {
            const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const quotedText = quotedMessage.imageMessage?.caption ||
                quotedMessage.extendedTextMessage?.text ||
                quotedMessage.conversation || '';
            if (!quotedText) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》No se pudo encontrar el mensaje citado.'
                }, { quoted: msg });
            }
            const characters = await loadCharacters();
            const characterIdMatch = quotedText.match(/✦ ID: \*(.+?)\*/);
            if (!characterIdMatch) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》No se pudo encontrar el ID del personaje en el mensaje citado.'
                }, { quoted: msg });
            }
            const characterId = characterIdMatch[1];
            const character = characters.find((c) => c.id === characterId);
            if (!character) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》El mensaje citado no es un personaje válido.'
                }, { quoted: msg });
            }
            if (character.user && character.user !== userId) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》El personaje ya ha sido reclamado por @${character.user.split('@')[0]}, inténtalo a la próxima :v.`,
                    mentions: [character.user]
                }, { quoted: msg });
            }
            character.user = userId;
            character.status = "Reclamado";
            await saveCharacters(characters);
            await sock.sendMessage(chatId, {
                text: `✦ Has reclamado a *${character.name}* con éxito.`
            }, { quoted: msg });
            cooldowns[userId] = now + 30 * 60 * 1000;
        }
        catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al reclamar el personaje: ${error.message}`
            }, { quoted: msg });
        }
    }
};
export default claimCommand;