import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const charactersFilePath = join(__dirname, '../database/characters.json')
async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data);
    } catch (error) {
        throw new Error('❀ No se pudo cargar el archivo characters.json.')
    }
}

const wimageCommand = {
    name: 'wimage',
    aliases: ['charimage', 'waifuimage'],
    category: 'gacha',
    description: 'Muestra una imagen aleatoria de un personaje',
    usage: '#wimage <nombre del personaje>',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        if (args.length === 0) { return await sock.sendMessage(chatId, {
                text: '《✧》Por favor, proporciona el nombre de un personaje.'
            }, { quoted: msg })
        }

        const characterName = args.join(' ').toLowerCase().trim()
        try {
            const characters = await loadCharacters()
            const character = characters.find((c) => c.name.toLowerCase() === characterName)
            if (!character) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》No se ha encontrado el personaje *${characterName}*. Asegúrate de que el nombre esté correcto.`
                }, { quoted: msg });
            }

            const randomImage = character.img[Math.floor(Math.random() * character.img.length)]
            const message = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
■ Fuente » *${character.source}*`
            await sock.sendMessage(chatId, {
                image: { url: randomImage },
                caption: message
            }, { quoted: msg })
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al cargar la imagen del personaje: ${error.message}`
            }, { quoted: msg })
        }
    }
}

export default wimageCommand