import { igdl } from 'ruhend-scraper'

const facebookCommand = {
    name: 'facebook',
    aliases: ['fb', 'fbdl'],
    category: 'downloads',
    description: 'Descarga videos de Facebook',
    usage: '#facebook [url de Facebook]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #facebook https://www.facebook.com/watch?v=xxxxx\n` +
                        `✿ #fb https://fb.watch/xxxxx`
                })
            }
            const url = args[0]
            if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Por favor ingresa un link válido de Facebook.'
                })
            } 
            let response
            try {
                response = await igdl(url)
            } catch (fetchError) {
                console.error('Error al obtener datos:', fetchError)
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al obtener datos. Verifica el enlace.\n\n' +
                        '💡 *Tip:* Asegúrate de que el video sea público.'
                })
            }
            const result = response.data;
            if (!result || result.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se encontraron resultados.\n\n' +
                        '💡 *Tip:* El video puede ser privado o el enlace es incorrecto.'
                })
            }
            let data;
            try {
                data = result.find(i => i.resolution === '720p (HD)') ||
                    result.find(i => i.resolution === '360p (SD)') ||
                    result[0]
            } catch (processError) {
                console.error('Error al procesar los datos:', processError)
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al procesar los datos.'
                })
            }
            if (!data || !data.url) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se encontró una resolución adecuada.'
                })
            } await sock.sendMessage(chatId, {
                text: '《✧》 Enviando video...'
            })

            try {
                await sock.sendMessage(chatId, {
                    video: { url: data.url },
                    caption: `《✧》 *Facebook Downloader*\n\n` +
                        `✿ *Resolución:* ${data.resolution || 'Desconocida'}\n` +
                        `✿ *Link original:* ${url}`,
                    fileName: 'facebook_video.mp4',
                    mimetype: 'video/mp4'
                }, { quoted: msg });
                await sock.sendMessage(chatId, {
                    text: `《✧》 ✅ *Descarga completada*`
                })
            } catch (sendError) {
                console.error('Error al enviar el video:', sendError)
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al enviar el video.\n\n' +
                        '💡 *Tip:* El archivo puede ser demasiado grande.'
                })
            }
        } catch (error) {
            console.error('Error en comando facebook:', error)
            let errorMessage = '《✧》 Error al descargar video de Facebook.'
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La descarga tardó demasiado. Intenta de nuevo.'
            }
            else if (error.response?.status === 404) {
                errorMessage = '《✧》 El video no fue encontrado o es privado.'
            }
            else if (error.response?.status === 400) {
                errorMessage = '《✧》 URL inválida. Verifica el enlace.'
            }
            else if (!error.response) {
                errorMessage = '《✧》 No se pudo conectar con el servicio de descarga.'
            }
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Asegúrate de que el video sea público y el enlace esté correcto.`
            })
        }
    }
}

export default facebookCommand