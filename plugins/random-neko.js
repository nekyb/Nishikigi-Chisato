import fetch from 'node-fetch'

const nekoCommand = {
    name: 'neko',
    aliases: [],
    category: 'random',
    description: 'Envía una imagen aleatoria de neko',
    usage: '#neko',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {const response = await fetch('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/random/anime/neko.txt')
            const nekoText = await response.text()
            const nekoUrls = nekoText.split('\n').filter(url => url.trim() !== '')
            if (nekoUrls.length === 0) {throw new Error('No se pudieron obtener imágenes de neko')}
            const randomNeko = nekoUrls[Math.floor(Math.random() * nekoUrls.length)]
            await sock.sendMessage(chatId, {
                image: { url: randomNeko },
                caption: '🐾 Nyaww~ 💗'
            }, { quoted: msg })} 
            catch (error) {await sock.sendMessage(chatId, {
                text: `✘ Error al obtener la imagen de neko: ${error.message}`
            }, { quoted: msg })}}}
export default nekoCommand