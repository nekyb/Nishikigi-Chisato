const formatMention = (jid) => '@' + jid.split('@')[0]

const formarParejaCommand = {
    name: 'formarpareja',
    aliases: ['formarparejas'],
    category: 'game',
    description: 'Forma parejas aleatorias en el grupo',
    usage: '#formarpareja',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        let groupMetadata
        try {groupMetadata = await sock.groupMetadata(chatId)} catch (error) {return await sock.sendMessage(chatId, {
                text: '✘ No se pudo obtener la información del grupo.'}, { quoted: msg })}
        if (!groupMetadata || !groupMetadata.participants) {return await sock.sendMessage(chatId, {
                text: '✘ No se pudo obtener la información del grupo.'}, { quoted: msg })}
        try {
            const participants = groupMetadata.participants.map((v) => v.id)
            if (participants.length < 2) {
                return await sock.sendMessage(chatId, {text: '⚠️ Se necesitan al menos 2 personas en el grupo para formar parejas.'}, { quoted: msg })}
            const person1 = participants[Math.floor(Math.random() * participants.length)]
            let person2
            do {person2 = participants[Math.floor(Math.random() * participants.length)]} while (person2 === person1)
            const pairMessage = `💕 *FORMANDO PAREJAS* 💕
${formatMention(person1)}, tu pareja del día es ${formatMention(person2)}, ¡Felicidades! 🎉

_¿Será el amor verdadero? 💘_`
            await sock.sendMessage(chatId, {
                text: pairMessage,
                mentions: [person1, person2]
            }, { quoted: msg })
        } catch (error) {console.log('Error en formarpareja:', error)
            await sock.sendMessage(chatId, {text: '❌ Ocurrió un error al formar las parejas.'}, { quoted: msg })}}}
export default formarParejaCommand