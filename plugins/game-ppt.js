const pptCommand = {
    name: 'ppt',
    aliases: ['piedrapapeltijera'],
    category: 'game',
    description: 'Juega piedra, papel o tijera con el bot',
    usage: '#ppt <piedra|papel|tijera>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        if (!global.db) {
            global.db = { data: { users: {} } }
        }
        if (!global.db.data) {
            global.db.data = { users: {} }
        }
        if (!global.db.data.users) {
            global.db.data.users = {}
        }
        if (!global.db.data.users[sender]) {
            global.db.data.users[sender] = {
                exp: 0,
                wait: 0
            }
        }

        const waitTime = global.db.data.users[sender].wait || 0
        const currentTime = new Date().getTime()
        const timeDiff = currentTime - waitTime
        if (timeDiff < 10000) {
            const remainingTime = Math.floor((10000 - timeDiff) / 1000)
            return await sock.sendMessage(chatId, {
                text: `⏳ Espera ${remainingTime} segundos antes de volver a jugar.`
            }, { quoted: msg })}
        if (args.length === 0) {
            const pp = 'https://telegra.ph/file/c7924bf0e0d839290cc51.jpg'
            return await sock.sendMessage(chatId, {
                text: `🎮 Para jugar usa:\n*◉ #ppt piedra*\n*◉ #ppt papel*\n*◉ #ppt tijera*`,
                contextInfo: {
                    externalAdReply: {
                        title: '🎮 Piedra, Papel o Tijera',
                        body: 'Elige tu opción',
                        thumbnailUrl: pp,
                        sourceUrl: pp
                    }
                }
            }, { quoted: msg })}
        let botChoice
        const random = Math.random()
        if (random < 0.34) {botChoice = 'piedra'} 
            else if (random < 0.67) {botChoice = 'tijera'} 
            else {botChoice = 'papel'}
        const userChoice = args[0].toLowerCase()
        if (!['piedra', 'papel', 'tijera'].includes(userChoice)) {
            return await sock.sendMessage(chatId, {
                text: `${tradutor.texto3[0]} #ppt piedra*\n*◉ #ppt papel*\n*◉ #ppt tijera*`
            }, { quoted: msg })}

        let result = ''
        if (userChoice === botChoice) {
            global.db.data.users[sender].exp += 500
            result = `🎯 Elegiste: *${userChoice}*\n🤖 Bot eligió: *${botChoice}*\n🎮 ¡Empate! +500 XP`}
        else if (
            (userChoice === 'piedra' && botChoice === 'tijera') ||
            (userChoice === 'papel' && botChoice === 'piedra') ||
            (userChoice === 'tijera' && botChoice === 'papel')
        ) {
            global.db.data.users[sender].exp += 1000
            result = `🎯 Elegiste: *${userChoice}*\n🤖 Bot eligió: *${botChoice}*\n🎉 ¡Ganaste! +1000 XP`}
        else {
            global.db.data.users[sender].exp -= 300
            result = `🎯 Elegiste: *${userChoice}*\n🤖 Bot eligió: *${botChoice}*\n💔 ¡Perdiste! -300 XP`}
        global.db.data.users[sender].wait = currentTime
        await sock.sendMessage(chatId, {
            text: result
        }, { quoted: msg })}}

export default pptCommand