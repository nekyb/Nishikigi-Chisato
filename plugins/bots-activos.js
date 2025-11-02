import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const botsCommand = {
    name: 'bots',
    aliases: ['subbots', 'listbots', 'jadibot'],
    category: 'info',
    description: 'Muestra información de los SubBots activos',
    usage: '#bots',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            const activeBots = [...new Set(
                global.conns.filter(bot => 
                    bot.user && 
                    bot.ws.socket && 
                    bot.ws.socket.readyState !== 3 ))]
            const subBotsPath = path.join(process.cwd(), 'SubBots')
            let totalFolders = 0
            if (fs.existsSync(subBotsPath)) {
                const items = fs.readdirSync(subBotsPath)
                totalFolders = items.filter(item => {
                    const itemPath = path.join(subBotsPath, item)
                    return fs.statSync(itemPath).isDirectory()}).length}
            let message = `╭━━━[ 𝗦𝘂𝗯𝗕𝗼𝘁𝘀 ]━━━━⬣\n`
            message += `┃\n`
            message += `┃ 📱 *SubBots Activos:* ${activeBots.length}\n`
            message += `┃ 📂 *Total Registrados:* ${totalFolders}\n`
            message += `┃\n`
            if (activeBots.length > 0) {
                message += `┃ *Lista de SubBots:*\n`
                activeBots.forEach((bot, index) => {
                    const name = bot.user?.name || 'Sin nombre'
                    const number = bot.user?.id?.split('@')[0] || 'Desconocido'
                    message += `┃ ${index + 1}. ${name} (+${number})\n`})} 
                    else {message += `┃ No hay SubBots activos\n`}
            message += `┃\n`
            message += `╰━━━━━━━━━━━━━━━⬣\n\n`
            message += `> _*By Soblend | Development Studio Creative*_`
            await sock.sendMessage(chatId, {
                text: message,
                contextInfo: {
                    externalAdReply: {
                        title: "Soblend | SubBots Status",
                        body: "Ver información de SubBots",
                        thumbnailUrl: "https://i.pinimg.com/474x/f2/1a/66/f21a66b35d8ca4d5b4b6ad16a9af678f.jpg",
                        sourceUrl: "",
                        mediaType: 1,
                        renderLargerThumbnail: true}}}, { quoted: msg })} catch (error) {console.error('Error en comando bots:', error)
            await sock.sendMessage(chatId, {text: '❌ Error al obtener información de los SubBots'}, { quoted: msg })}}}
export default botsCommand