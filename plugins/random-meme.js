// Creditos - ig : https://www.instagram.com/fg98._/
import hispamemes from 'hispamemes'

const memeCommand = {
    name: 'meme',
    aliases: ['memes'],
    category: 'random',
    description: 'Envía un meme aleatorio en español',
    usage: '#meme',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {const memeUrl = await hispamemes.meme()
            if (!memeUrl) {throw new Error('No se pudo obtener el meme')}
            await sock.sendMessage(chatId, {
                image: { url: memeUrl },
                caption: '🤣 _Meme_ 🤣'
            }, { quoted: msg })}
            catch (error) {await sock.sendMessage(chatId, {text: `✘ Error al obtener el meme: ${error.message}\n\n_Intenta nuevamente en unos segundos_`}, { quoted: msg })}}}
export default memeCommand