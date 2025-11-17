import wiki from 'wikijs'

const comandoparabuscarenfandom = {
    name: 'fandom',
    aliases: ['wikif'],
    category: 'search',
    description: 'Busca informacion o algo en Fandom.com',
    usage: '#fandom [termino]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const query = args.join(' ')
        if (!query) return
        try { const page = await wiki({ apiUrl: 'https://community.fandom.com/api.php'}).page(query)
    const summary = await page.summary()
const images = await page.images()
const image = images.find(img => images.endsWith('.jpg') || images.endsWith('.png'))
await sock.sendMesage(chatId, {
    image: { url: image},
    caption: `*page.raw.title*{sumary.slice(0, 1500)}`
})
} catch {
    await sock.sendMessage(chatId, { text: '《✿》No se encontro informacion D:'})
}
    }
}

export default comandoparabuscarenfandom