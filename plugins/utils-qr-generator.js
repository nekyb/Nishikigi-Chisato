import qrcode from 'qrcode'
import { Buffer } from 'buffer'

export default {
    name: 'qr',
    aliases: ['qrcode', 'genqr'],
    category: 'tools',
    description: 'Genera un código QR a partir de texto o URL',
    usage: '.qr [texto o URL]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        if (args.length === 0) {return await sock.sendMessage(chatId, {text: '⚠️ *Uso correcto:* .qr [texto o URL]\n\n*Ejemplos:*\n• .qr https://google.com\n• .qr Hola Mundo\n• .qr +573012345678'}, { quoted: msg })}
        await sock.sendMessage(chatId, {
            react: {
                text: '📱',
                key: msg.key}})
        const text = args.join(' ')
        try {const qrBuffer = await qrcode.toBuffer(text, {
                errorCorrectionLevel: 'H',
                type: 'png',
                quality: 0.95,
                margin: 1,
                width: 500,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'}})
            await sock.sendMessage(chatId, {
                image: qrBuffer,
                caption: `✅ *QR GENERADO*\n\n📝 *Contenido:* ${text.length > 100 ? text.substring(0, 100) + '...' : text}\n\n> _*Escanea el código QR con tu cámara*_`}, { quoted: msg })} 
                catch (error) {console.error('Error generando QR:', error)
            await sock.sendMessage(chatId, {text: '❌ Error al generar el código QR. El texto puede ser demasiado largo.'}, { quoted: msg })}}}