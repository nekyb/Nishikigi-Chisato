import fetch from 'node-fetch'

const catCommand = {
    name: 'cat',
    aliases: [],
    category: 'random',
    description: 'Envía una imagen aleatoria de gatos',
    usage: '#cat',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            const response = await fetch('https://api.thecatapi.com/v1/images/search')
            if (!response.ok) {throw new Error('No se pudo conectar con la API de gatos')}
            const data = await response.json()
            if (!data || data.length === 0 || !data[0].url) {throw new Error('No se recibió ninguna imagen')}
            const catImageUrl = data[0].url
            const caption = `
🐱 _Imagen aleatoria de gato_

_© Soblend | Nishikigi Bot - MD_
`.trim()
            await sock.sendMessage(chatId, {
                image: { url: catImageUrl },
                caption: caption
            }, { quoted: msg })}
            catch (error) {console.log('Error en comando cat:', error)
            await sock.sendMessage(chatId, {text: '✘ Error al obtener la imagen del gato. Intenta nuevamente.'}, { quoted: msg })}}}
export default catCommand