const desbloquearCommand = {
    name: 'desbloquear',
    aliases: ['unlock'],
    category: 'gacha',
    description: 'Desbloquea la base de un usuario por 3 minutos',
    usage: '#desbloquear @usuario',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const user = msg.key.participant || msg.key.remoteJid
        if (!global.db) {
            global.db = { data: { users: {} } }
        }
        if (!global.db.data) {
            global.db.data = { users: {} }
        }
        if (!global.db.data.users) {
            global.db.data.users = {}
        }
        const users = global.db.data.users
        let userData = users[user]
        if (!userData) {
            userData = users[user] = { monedas: 0, antirobo: 0, desbloqueo: 0 }
        }
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        let target = mentionedJid[0] || args[0]
        if (!target) {
            return await sock.sendMessage(chatId, {
                text: `✘ Debes mencionar a alguien.\n\nEjemplo:\n*#desbloquear @usuario*`
            }, { quoted: msg });
        }
        if (target && !target.includes('@s.whatsapp.net')) {
            target = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        }
        if (!(target in users)) {
            users[target] = { monedas: 0, antirobo: 0, desbloqueo: 0 }
        }
        let targetData = users[target]
        if (!targetData) {
            targetData = users[target] = { monedas: 0, antirobo: 0, desbloqueo: 0 }
        }
        const costo = 100000
        const duracion = 3 * 60 * 1000
        if (userData.monedas < costo) {
            return await sock.sendMessage(chatId, {
                text: `✘ No tienes suficientes monedas.\nNecesitas *${costo.toLocaleString()}* monedas para desbloquear la base de @${target.split('@')[0]}.`,
                mentions: [target]
            }, { quoted: msg })
        }
        userData.monedas -= costo;
        targetData.desbloqueo = Date.now() + duracion
        targetData.antirobo = 0;
        await sock.sendMessage(chatId, {
            text: `⚠️ *Base desbloqueada*.\n🔓 @${target.split('@')[0]} ahora está vulnerable por 3 minutos.\n⏳ Podrás robar sus waifus hasta: *${new Date(targetData.desbloqueo).toLocaleString()}*`,
            mentions: [target]
        }, { quoted: msg });
    }
}

export default desbloquearCommand