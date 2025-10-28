const tagallCommand = {
    name: 'tagall',
    aliases: ['todos', 'invocar'],
    category: 'group',
    description: 'Menciona a todos los miembros del grupo',
    usage: '#tagall [mensaje opcional]',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            const groupMetadata = await sock.groupMetadata(chatId)
            const participants = groupMetadata.participants;
            const mentions = participants.map((p) => p.id);
            const message = args.join(' ') || 'Invocación grupal'
            let text = `《✧》 *INVOCACIÓN GRUPAL* 《✧》\n\n`
            text += `✿ *Mensaje:* ${message}\n\n`
            text += `━━━━━━━━━━━━━━━\n\n`
            participants.forEach((p, i) => {
                text += `${i + 1}. @${p.id.split('@')[0]}\n`
            }); await sock.sendMessage(chatId, {
                text: text,
                mentions: mentions
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en tagall:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al mencionar a todos.\n\n💡 *Tip:* Este comando solo funciona en grupos.'
            })}}}
export default tagallCommand