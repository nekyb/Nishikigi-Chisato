import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const charactersFilePath = join(__dirname, '../database/characters.json')
async function loadCharacters() {
    const data = await fs.readFile(charactersFilePath, 'utf-8')
    return JSON.parse(data)
}

async function saveCharacters(characters) {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8')
}

const resetwaifusCommand = {
    name: 'resetwaifus',
    aliases: ['reiniciarwaifus'],
    category: 'gacha',
    description: 'Reinicia todas las waifus (solo owner)',
    usage: '#resetwaifus',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args, isOwner) {
        const chatId = msg.key.remoteJid;
        if (!isOwner) {
            return await sock.sendMessage(chatId, {
                text: '✘ Solo el owner puede usar este comando.'
            }, { quoted: msg })
        }

        try {
            const characters = await loadCharacters()
            if (characters.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '✘ No hay waifus registradas.'
                }, { quoted: msg })
            }

            characters.forEach((c) => {
                c.user = null;
                c.status = 'Libre'
            })

            await saveCharacters(characters);
            await sock.sendMessage(chatId, {
                text: '✅ Todas las waifus han sido reiniciadas. Ahora nadie las posee.'
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
}

export default resetwaifusCommand