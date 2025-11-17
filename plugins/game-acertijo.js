import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const acertijosFilePath = join(__dirname, '../database/acertijos.json')
async function loadAcertijos() {
    try {
        const data = await fs.readFile(acertijosFilePath, 'utf-8')
        return JSON.parse(data)}
        catch (error) {throw new Error('No se pudo cargar el archivo acertijos.json.')}}

const timeout = 60000; 
const poin = 500; 
const acertijoCommand = {
    name: 'acertijo',
    aliases: ['acert', 'pregunta', 'adivinanza', 'tekateki'],
    category: 'game',
    description: 'Juego de acertijos y adivinanzas',
    usage: '#acertijo',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        if (!global.gameData) {
            global.gameData = {}}
        if (!global.gameData.acertijos) {
            global.gameData.acertijos = {}}
        if (global.gameData.acertijos[chatId]) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Ya hay un acertijo activo en este chat. ¡Responde primero el actual!'
            }, { quoted: global.gameData.acertijos[chatId].message })}
        try {
            const acertijos = await loadAcertijos()
            const randomAcertijo = acertijos[Math.floor(Math.random() * acertijos.length)]
            const clue = randomAcertijo.response.replace(/[A-Za-z]/g, '_')
            const caption = `
🎯 *ACERTIJO*

${randomAcertijo.question}

⏱️ Tiempo: ${(timeout / 1000).toFixed(0)} segundos
💰 Recompensa: +${poin} XP
💡 Pista: ${clue}

_Responde con la respuesta correcta_
`.trim()

            const sentMsg = await sock.sendMessage(chatId, {
                text: caption
            }, { quoted: msg })
            global.gameData.acertijos[chatId] = {
                message: sentMsg,
                answer: randomAcertijo.response.toLowerCase().trim(),
                points: poin,
                timeout: setTimeout(async () => {
                    if (global.gameData.acertijos[chatId]) {
                        await sock.sendMessage(chatId, {
                            text: `⏰ ¡Se acabó el tiempo!\n\n✅ La respuesta correcta era: *${randomAcertijo.response}*`
                        }, { quoted: sentMsg })
                        delete global.gameData.acertijos[chatId]
                    }
                }, timeout)
            }
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al cargar el acertijo: ${error.message}`
            }, { quoted: msg })}},
    
    async checkAnswer(sock, msg) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        if (!global.gameData?.acertijos?.[chatId]) return false
        const gameSession = global.gameData.acertijos[chatId]
        const userAnswer = msg.message?.conversation?.toLowerCase().trim() || 
                          msg.message?.extendedTextMessage?.text?.toLowerCase().trim()
        if (!userAnswer) return false
        if (userAnswer === gameSession.answer) {
            clearTimeout(gameSession.timeout)
            if (!global.db.data.users[sender]) {
                global.db.data.users[sender] = { exp: 0 }}
            global.db.data.users[sender].exp = (global.db.data.users[sender].exp || 0) + gameSession.points
            await sock.sendMessage(chatId, {
                text: `🎉 ¡Correcto, @${sender.split('@')[0]}!\n\n✅ Respuesta: *${gameSession.answer}*\n💰 Has ganado +${gameSession.points} XP`,
                mentions: [sender]
            }, { quoted: gameSession.message })
            delete global.gameData.acertijos[chatId]
            return true}
        return false}}
export default acertijoCommand