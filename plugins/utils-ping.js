const pingCommand = {
    name: 'ping',
    aliases: ['p'],
    category: 'utils',
    description: 'Verifica la velocidad de respuesta del bot',
    usage: '#ping',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {const startTime = Date.now()
            const endTime = Date.now()
            const responseTime = endTime - startTime
            await sock.sendMessage(chatId, {
                text: `☪︎ 𝔓𝔬𝔴𝔢𝔯𝔢𝔡 𝔅𝔶 𝔇𝔢𝔩𝔱𝔞𝔅𝔶𝔱𝔢\n` +
                    `ꫂ❁ ¡Pong!\n` +
                    `✦ Tiempo: ${responseTime}ms`}, { quoted: msg })} catch (error) {console.error('Error en comando ping:', error);
            await sock.sendMessage(chatId, {text: '《✧》 Error al calcular el ping.'})}}}
export default pingCommand