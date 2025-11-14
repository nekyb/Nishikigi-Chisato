import axios from 'axios'

const xvidlCommand = {
    name: 'xvidl',
    aliases: ['twidl', 'twitterdl'],
    category: 'downloads',
    description: 'Descarga videos de Twitter/X a partir de un enlace.',
    usage: '#xvidl [enlace de Twitter/X]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Uso incorrecto del comando*\n\n' +
                        'Ejemplo:\n' +
                        '✿ #xvidl https://x.com/user/status/xxxxxxxx'
                })
            }

            const url = args[0]
            if (!url.includes('twitter.com') && !url.includes('x.com')) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor, introduce un enlace válido de Twitter/X.'
                })
            }

            const apiEndpoint = `https://api.delirius.store/download/twitter?url=${encodeURIComponent(url)}`
            const response = await axios.get(apiEndpoint, { timeout: 20000 })
            const data = response.data.data
            if (!data || data.length === 0) {
                 return await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo encontrar el video. Podría ser privado o la API falló.'
                })
            }

            const videoUrl = data[data.length - 1].url
            await sock.sendMessage(chatId, {
                text: `《✧》 Enviando video...`
            })

            await sock.sendMessage(chatId, {
                video: { url: videoUrl },
                caption: `✅ Descarga de Video de Twitter/X completada.`
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en comando xvidl:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al descargar el video de Twitter/X. Asegúrate de que el enlace sea público y válido.'
            })
        }
    }
}

export default xvidlCommand