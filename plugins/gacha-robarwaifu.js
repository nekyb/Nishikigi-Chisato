// Este codigo esta inspirado en el desarrollador The Carlos, creditos a el.

import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const charactersFilePath = join(__dirname, '../database/characters.json')
const cooldownFilePath = join(__dirname, '../database/waifu_cooldown.json')
const botOwner = '5217971282613@s.whatsapp.net'
async function loadCharacters() {
    const data = await fs.readFile(charactersFilePath, 'utf-8')
    return JSON.parse(data);
}

async function saveCharacters(characters) {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8')
}

async function loadCooldown() {
    try {
        const data = await fs.readFile(cooldownFilePath, 'utf-8')
        return JSON.parse(data)
    }
    catch {
        return {}
    }
}

async function saveCooldown(cooldowns) {
    await fs.writeFile(cooldownFilePath, JSON.stringify(cooldowns, null, 2), 'utf-8')
}

const robarwaifuCommand = {
    name: 'robarwaifu',
    aliases: ['robar'],
    category: 'gacha',
    description: 'Roba un personaje de otro usuario',
    usage: '#robarwaifu <id>',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const user = msg.key.participant || msg.key.remoteJid
        try {
            if (!args[0]) {
                return await sock.sendMessage(chatId, {
                    text: '✘ Debes proporcionar el ID de la waifu que quieres robar.'
                }, { quoted: msg });
            }

            const characters = await loadCharacters()
            const cooldowns = await loadCooldown()
            const waifuId = args[0]
            const waifu = characters.find((c) => c.id === waifuId)
            if (!waifu) {
                return await sock.sendMessage(chatId, {
                    text: `✘ No se encontró ninguna waifu con el ID: *${waifuId}*`
                }, { quoted: msg })
            }

            const oldOwner = waifu.user
            if (oldOwner === botOwner) {
                return await sock.sendMessage(chatId, {
                    text: `✘ No puedes robar la waifu de mi owner *${waifu.name}* (ID: ${waifu.id}).`
                }, { quoted: msg })
            }

            if (!global.db) {
                global.db = { data: { users: {} } }
            }
            if (!global.db.data) {
                global.db.data = { users: {} }
            }
            if (!global.db.data.users) {
                global.db.data.users = {}
            }

            if (global.db.data.users[oldOwner]?.antirobo > Date.now()) {
                return await sock.sendMessage(chatId, {
                    text: `🛡 La waifu *${waifu.name}* (ID: ${waifu.id}) tiene AntiRobo activo.\nNo puedes robarla hasta: *${new Date(global.db.data.users[oldOwner].antirobo).toLocaleString()}*`
                }, { quoted: msg })
            }

            if (user !== botOwner) {
                const now = Date.now()
                const cooldownTime = 10 * 60 * 1000
                const userCooldown = cooldowns[user] || { count: 0, reset: 0 }
                if (now > userCooldown.reset) {
                    userCooldown.count = 0
                    userCooldown.reset = now + cooldownTime
                }

                if (userCooldown.count >= 2) {
                    const tiempoRestante = Math.ceil((userCooldown.reset - now) / 60000)
                    return await sock.sendMessage(chatId, {
                        text: `✘ Ya has robado 2 waifus. Espera *${tiempoRestante} minuto(s)* para volver a robar.`
                    }, { quoted: msg })
                }
                userCooldown.count++
                cooldowns[user] = userCooldown
                await saveCooldown(cooldowns)
            }

            waifu.user = user
            await saveCharacters(characters)
            await sock.sendMessage(chatId, {
                text: `✧ Has robado a *${waifu.name}* (ID: ${waifu.id}) del usuario *${oldOwner?.split('@')[0] || 'Nadie'}* ✧`
            }, { quoted: msg })
            if (oldOwner && oldOwner !== user && oldOwner !== botOwner) {
                await sock.sendMessage(oldOwner, {
                    text: `✘ El usuario *@${user.split('@')[0]}* ha robado tu waifu *${waifu.name}* (ID: ${waifu.id}).`,
                    mentions: [user]
                })
            }
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error: ${error.message}`
            }, { quoted: msg })
        }
    }
}

export default robarwaifuCommand