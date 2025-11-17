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

const darCommand = {
    name: 'dar',
    aliases: ['give', 'regalar'],
    category: 'gacha',
    description: 'Da un personaje a otro usuario',
    usage: '#dar @usuario <id>',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const user = msg.key.participant || msg.key.remoteJid
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        let target = mentionedJid[0] || args[0]
        if (!target) {
            return await sock.sendMessage(chatId, {
                text: '✘ Debes mencionar a un usuario.\n\nEjemplo:\n*#dar @usuario id123*'
            }, { quoted: msg })
        }

        if (target && !target.includes('@s.whatsapp.net')) {
            target = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        }

        const characterId = args[1] || args[0]
        if (!characterId || characterId.includes('@')) {
            return await sock.sendMessage(chatId, {
                text: '✘ Debes proporcionar el ID del personaje.\n\nEjemplo:\n*#dar @usuario id123*'
            }, { quoted: msg })
        }

        try {
            const characters = await loadCharacters()
            const character = characters.find((c) => c.id === characterId)
            if (!character) {
                return await sock.sendMessage(chatId, {
                    text: `✘ No se encontró ningún personaje con el ID: *${characterId}*`
                }, { quoted: msg })
            }

            const previousOwner = character.user
            character.user = target
            character.status = 'Reclamado'
            await saveCharacters(characters)
            let confirmMessage = `✧ *${character.name}* (ID: ${character.id}) ha sido entregado a @${target.split('@')[0]} exitosamente.`
            if (previousOwner && previousOwner !== user) {
                confirmMessage += `\n\n⚠️ Nota: El personaje pertenecía a @${previousOwner.split('@')[0]}`
            }

            await sock.sendMessage(chatId, {
                text: confirmMessage,
                mentions: [target, previousOwner].filter(Boolean)
            }, { quoted: msg })
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al dar el personaje: ${error.message}`
            }, { quoted: msg })
        }
    }
}

export default darCommand