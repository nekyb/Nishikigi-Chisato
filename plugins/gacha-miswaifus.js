import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename);
const charactersFilePath = join(__dirname, '../database/characters.json')
async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('❀ No se pudo cargar el archivo characters.json.')
    }
}

const miswaifusCommand = {
    name: 'miswaifus',
    aliases: ['mywaifus'],
    category: 'gacha',
    description: 'Muestra tus personajes reclamados',
    usage: '#miswaifus',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const userId = msg.key.participant || msg.key.remoteJid
        try {
            const characters = await loadCharacters()
            const myWaifus = characters.filter((c) => c.user === userId)
            if (myWaifus.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✿》No tienes ninguna waifu reclamada.'
                }, { quoted: msg })
            }

            let message = `❀ *Tus waifus (${myWaifus.length}):*\n\n`
            myWaifus.forEach((waifu, index) => {
                message += `✰ ${index + 1} » *${waifu.name}*\n`
                message += `\t\t→ ID: ${waifu.id}\n`
                message += `\t\t→ Valor: ${waifu.value}\n`
            })

            await sock.sendMessage(chatId, {
                text: message
            }, { quoted: msg })
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al obtener tus waifus: ${error.message}`
            }, { quoted: msg })
        }
    }
}

export default miswaifusCommand