const infobotCommand = {
    name: 'infobot',
    aliases: ['info', 'about', 'acerca'],
    category: 'general',
    description: 'Información sobre el bot',
    usage: '.infobot',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid

        try {
            // 💬 Mensaje principal
            const contentText = 
`《✧》 *INFORMACIÓN DEL BOT* 《✧》

━━━━━━━━━━━━━━━━━━━

Soy *Nishikigi Chisato*, un bot desarrollado por *DeltaByte*.
Mi objetivo es brindar entretenimiento, innovación y facilidad para administrar grupos de WhatsApp.
Tal vez no sea el mejor, pero puedo ayudar en lo que necesites.

━━━━━━━━━━━━━━━━━━━

💡 *Características:*
✦ Descargas multimedia
✦ Búsquedas inteligentes
✦ Administración de grupos
✦ Entretenimiento
✦ Y mucho más...

━━━━━━━━━━━━━━━━━━━

🌐 *Sitio Web:* https://deltabyte.com
💬 *Telegram:* https://t.me/DeltaByte
📦 *GitHub:* https://github.com/DeltaByteDev

━━━━━━━━━━━━━━━━━━━

© Nishikigi Chisato Bot 2025`

            console.log('📤 Enviando mensaje simple...')

            // Enviar mensaje de texto simple (más confiable)
            await sock.sendMessage(chatId, {
                text: contentText
            }, { quoted: msg })
            
            console.log('✅ Mensaje enviado correctamente')
            
        } catch (error) {
            console.error('❌ Error en comando infobot:', error)
            console.error('Stack:', error.stack)
            
            // Mensaje de error
            await sock.sendMessage(chatId, {
                text: '❌ Hubo un error al mostrar la información del bot.'
            }).catch(e => console.error('Error enviando mensaje de error:', e))
        }
    }
}

export default infobotCommand