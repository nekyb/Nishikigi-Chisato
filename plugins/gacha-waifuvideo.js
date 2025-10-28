import { promises as fs } from 'fs';
const charactersFilePath = './src/database/characters.json';
async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error('❀ No se pudo cargar el archivo characters.json.');
    }
}
const waifuvideoCommand = {
    name: 'wvideo',
    aliases: ['charvideo', 'waifuvideo'],
    category: 'gacha',
    description: 'Muestra un video aleatorio de un personaje',
    usage: '#wvideo <nombre del personaje>',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        if (args.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '《✧》Por favor, proporciona el nombre de un personaje.'
            }, { quoted: msg });
        }
        const characterName = args.join(' ').toLowerCase().trim();
        try {
            const characters = await loadCharacters();
            const character = characters.find((c) => c.name.toLowerCase() === characterName);
            if (!character) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》No se ha encontrado el personaje *${characterName}*. Asegúrate de que el nombre esté correcto.`
                }, { quoted: msg });
            }
            if (!character.vid || character.vid.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》No se encontró un video para *${character.name}*.`
                }, { quoted: msg });
            }
            const randomVideo = character.vid[Math.floor(Math.random() * character.vid.length)];
            const message = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
■ Fuente » *${character.source}*`;
            const sendAsGif = Math.random() < 0.5;
            if (sendAsGif) {
                await sock.sendMessage(chatId, {
                    video: { url: randomVideo },
                    gifPlayback: true,
                    caption: message
                }, { quoted: msg });
            }
            else {
                await sock.sendMessage(chatId, {
                    video: { url: randomVideo },
                    caption: message
                }, { quoted: msg });
            }
        }
        catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al cargar el video del personaje: ${error.message}`
            }, { quoted: msg });
        }
    }
};
export default waifuvideoCommand;