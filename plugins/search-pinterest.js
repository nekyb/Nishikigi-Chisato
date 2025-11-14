import axios from 'axios'
import * as baileys from '@soblend/baileys'

const pinterestCommand = {
    name: 'pinterest',
    aliases: ['pin', 'pinsearch'],
    category: 'downloads',
    description: 'Busca y descarga imágenes de Pinterest',
    usage: '#pinterest [texto de búsqueda]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const dev = 'DeltaByte'
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #pinterest gatos\n` +
                        `✿ #pin aesthetic wallpaper\n` +
                        `✿ #pin naturaleza`
                });
            }
            
            const searchQuery = args.join(' ')
            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando imágenes en Pinterest...'
            }, { quoted: msg })
            
            const apiUrl = `https://pinscrapper.vercel.app/api/pinterest/search?q=${encodeURIComponent(searchQuery)}&limit=7`
            const response = await axios.get(apiUrl, {
                timeout: 20000
            })
            
            const data = response.data
            if (!data.success || !data.images || data.images.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se encontraron imágenes para tu búsqueda.\n\n' +
                        '💡 *Tip:* Intenta con otras palabras clave.'
                })
            }
            
            const images = data.images
            await sock.sendMessage(chatId, {
                text: `《✧》 *Se encontraron ${images.length} imágenes*\n\n` +
                    `📌 Creando carousel...`
            }, { quoted: msg })
            const cards = []
            for (let image of images) {
                try {
                    const imageMsg = await sock.sendMessage(sock.user.id, {
                        image: { url: image.imageUrl }
                    })
                    
                    if (imageMsg?.message?.imageMessage) {
                        const card = {
                            body: baileys.proto.Message.InteractiveMessage.Body.fromObject({
                                text: `✿ ${image.description || 'Sin descripción'}` }),
                            footer: baileys.proto.Message.InteractiveMessage.Footer.fromObject({
                                text: dev }),
                            header: baileys.proto.Message.InteractiveMessage.Header.fromObject({
                                title: image.title || 'Pinterest',
                                hasMediaAttachment: true,
                                imageMessage: imageMsg.message.imageMessage }),
                            nativeFlowMessage: baileys.proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: []
                            })
                        } 
                        cards.push(card)
                    }
                } catch (cardError) {
                    console.error('Error creando tarjeta:', cardError.message)
                }
            }
            
            if (cards.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: "《✧》 No se pudieron procesar las imágenes encontradas."
                }, { quoted: msg })
            }
            
            try {
                const carouselMessage = baileys.generateWAMessageFromContent(chatId, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2 },
                            interactiveMessage: baileys.proto.Message.InteractiveMessage.fromObject({
                                body: baileys.proto.Message.InteractiveMessage.Body.create({
                                    text: `📌 RESULTADOS DE: ${searchQuery}`}),
                                footer: baileys.proto.Message.InteractiveMessage.Footer.create({
                                    text: dev }),
                                header: baileys.proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false }),
                                carouselMessage: baileys.proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                    cards: cards
                                })
                            })
                        }
                    }
                }, {
                    quoted: msg
                })

                await sock.relayMessage(chatId, carouselMessage.message, {
                    messageId: carouselMessage.key.id
                })
                } catch (carouselError) {
                console.error('Error enviando carousel:', carouselError)
                await sock.sendMessage(chatId, {
                    text: "《✧》 Enviando imágenes individualmente..."
                }, { quoted: msg })
                for (let i = 0; i < images.length; i++) {
                    const image = images[i]
                    try {
                        const caption = `《✧》 *Pinterest* 📌\n\n` +
                            `✿ *Título:* ${image.title || 'Sin título'}\n` +
                            `✿ *Autor:* ${image.author || 'Desconocido'}\n` +
                            `✿ *Descripción:* ${image.description || 'Sin descripción'}\n` +
                            `✿ *Link:* ${image.originalUrl}\n\n` +
                            `_Imagen ${i + 1} de ${images.length}_`
                        await sock.sendMessage(chatId, {
                            image: { url: image.imageUrl },
                            caption: caption
                        }, { quoted: msg })
                        if (i < images.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1500)) }
                    } catch (sendError) {
                        console.error(`Error enviando imagen ${i + 1}:`, sendError)}}}
                    } catch (error) {
            console.error('Error en comando pinterest:', error)
            let errorMessage = '《✧》 Error al buscar imágenes en Pinterest.'
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La búsqueda tardó demasiado. Intenta de nuevo.'
            } else if (error.response?.status === 404) {
                errorMessage = '《✧》 El servicio de Pinterest no está disponible en este momento.'
            } else if (error.response?.status === 400) {
                errorMessage = '《✧》 Búsqueda inválida. Intenta con otras palabras.'
            } else if (!error.response) {
                errorMessage = '《✧》 No se pudo conectar con el servicio de Pinterest.'}
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Verifica tu conexión e intenta con términos más específicos.`})}}}
export default pinterestCommand;