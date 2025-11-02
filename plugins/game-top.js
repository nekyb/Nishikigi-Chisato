import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const formatUser = (jid) => '@' + jid.split('@')[0]
const getRandomUsers = (participants, count = 10) => {
    const participantIds = participants.map((v) => v.id)
    const randomUsers = []
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * participantIds.length)
        randomUsers.push(participantIds[randomIndex])
    }
    
    return randomUsers
}

const topsCommand = {
    name: 'topgays',
    aliases: ['topotakus'],
    category: 'game',
    description: 'Genera tops aleatorios del grupo',
    usage: '#topgays o #topotakus',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const command = msg.command || args[0] || ''
        
        try {
            const groupMetadata = await sock.groupMetadata(chatId)
            if (!groupMetadata || !groupMetadata.participants) {
                return await sock.sendMessage(chatId, {
                    text: '✘ No se pudo obtener la información del grupo.'
                }, { quoted: msg })
            }
            const randomUsers = getRandomUsers(groupMetadata.participants, 10)
            let topTitle = ''
            let audioPath = ''
            if (command === 'topgays') {
                topTitle = '🏳️‍🌈 *TOP 10 GAYS DEL GRUPO* 🏳️‍🌈'
                audioPath = join(__dirname, '../src/assets/audio/01J673A5RN30C5EYPMKE5MR9XQ.mp3')}
                else if (command === 'topotakus') {topTitle = '🎌 *TOP 10 OTAKUS DEL GRUPO* 🎌'
                audioPath = join(__dirname, '../src/assets/audio/01J67441AFAPG1YRQXDQ0VDTZB.mp3')}
            const topMessage = `${topTitle}
*_1.- ${formatUser(randomUsers[0])}_*
*_2.- ${formatUser(randomUsers[1])}_*
*_3.- ${formatUser(randomUsers[2])}_*
*_4.- ${formatUser(randomUsers[3])}_*
*_5.- ${formatUser(randomUsers[4])}_*
*_6.- ${formatUser(randomUsers[5])}_*
*_7.- ${formatUser(randomUsers[6])}_*
*_8.- ${formatUser(randomUsers[7])}_*
*_9.- ${formatUser(randomUsers[8])}_*
*_10.- ${formatUser(randomUsers[9])}_*`
            await sock.sendMessage(chatId, {
                text: topMessage,
                mentions: randomUsers
            }, { quoted: msg })
            try {await sock.sendMessage(chatId, {
                    audio: { url: audioPath },
                    fileName: 'audio.mp3',
                    mimetype: 'audio/mpeg',
                    ptt: true
                }, { quoted: msg })
            } catch (audioError) {
                console.log('No se pudo enviar el audio:', audioError.message)}  
            } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error al generar el top: ${error.message}`
            }, { quoted: msg })}}}
export default topsCommand