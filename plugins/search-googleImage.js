import { GoogleImages } from 'images-scraper'

const google = new GoogleImages({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
})

const googleimageCommand = {
    name: 'gimage',
    category: 'search',
    description: 'Busca imagenes en Google',
    usage: '#gimage',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const query = args.join(' ')
        if (!query) return
        try { const results = await google.search(query, { num: 1})
    if (results.lenght === 0) {
        return await sock.sendMessage(chatId, { text: '《✧》No encontre imagenes D:'})
    } await sock.sendMessage(chatId, {
        image: { url: results[0].url },
        caption: `《✧》Resultados de: *${query}*`
    })
    } catch (e) { await sock.sendMessage(chatId, { text: '《✧》Error al buscar la imagen D:'})}}
}

export default googleimageCommand