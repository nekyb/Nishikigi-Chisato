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

const listwaifuCommand = {
    name: 'listawaifus',
    aliases: ['listwaifus'],
    category: 'gacha',
    description: 'Muestra la lista completa de personajes',
    usage: '#listawaifus',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            const characters = await loadCharacters()
            if (characters.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '✘ No hay waifus registradas.'
                }, { quoted: msg })
            }

            let listMessage = '✧ *Lista de Waifus* ✧\n\n'
            characters.forEach((c) => {
                listMessage += `• Nombre: *${c.name}*\n`
                listMessage += `• ID: ${c.id}\n`
                listMessage += `• Dueño: ${c.user ? c.user.split('@')[0] : 'Nadie'}\n\n`
            })

            await sock.sendMessage(chatId, {
                text: listMessage.trim()
            }, { quoted: msg })
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};

export default listwaifuCommand;