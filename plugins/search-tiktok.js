import axios from 'axios'
import * as baileys from '@whiskeysockets/baileys'

console.log('Funciones disponibles en baileys:', Object.keys(baileys))
const tiktokSearchCommand = {
    name: 'tiktoksearch',
    aliases: ['ttss', 'tiktoks'],
    category: 'buscador',
    description: 'Busca y descarga videos de TikTok',
    usage: '#tiktoksearch <texto>',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const text = args.join(' ');
        const avatar = 'https://qu.ax/XKFEL.jpg';
        const dev = 'DeltaByte';
        const redes = 'https://tiktok.com/@drexell1_'
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: "🥷🏻 Por favor, ingrese un texto para realizar una búsqueda en TikTok."
            }, { quoted: msg });
        }
        
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
[array[i], array[j]] = [array[j], array[i]];
            }
        }
        
        try {
            await sock.sendMessage(chatId, {
                text: '⌛ *DESCARGANDO SUS RESULTADOS..*'
            }, {
                quoted: msg,
                contextInfo: { 
                    externalAdReply: { 
                        mediaUrl: null, 
                        mediaType: 1, 
                        showAdAttribution: true,
                        title: '♡  ͜ ۬(࣪᷼⏜݊᷼Descargas⏜࣪᷼(۬ ͜ ',
                        body: dev,
                        previewType: 0, 
                        thumbnail: avatar,
                        sourceUrl: redes 
                    }
                }
            })
            
            let { data } = await axios.get(
                "https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=" + encodeURIComponent(text)
            )
            
            if (!data || !data.data || data.data.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: "⚠︎ No se encontraron resultados para: " + text
                }, { quoted: msg });
            }
            
            let searchResults = data.data
            shuffleArray(searchResults)
            let topResults = searchResults.splice(0, 7)
            const cards = []
            for (let result of topResults) {
                try {
                    const videoMsg = await sock.sendMessage(sock.user.id, {
                        video: { url: result.nowm }
                    })
                    
                    if (videoMsg && videoMsg.message && videoMsg.message.videoMessage) {
                        const card = {
                            body: baileys.proto.Message.InteractiveMessage.Body.fromObject({ 
                                text: null 
                            }),
                            footer: baileys.proto.Message.InteractiveMessage.Footer.fromObject({ 
                                text: dev 
                            }),
                            header: baileys.proto.Message.InteractiveMessage.Header.fromObject({
                                title: result.title || 'Video de TikTok',
                                hasMediaAttachment: true,
                                videoMessage: videoMsg.message.videoMessage
                            }),
                            nativeFlowMessage: baileys.proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ 
                                buttons: [] 
                            })
                        }
                        
                        cards.push(card)
                    }
                } catch (cardError) {
                    console.error('Error creando tarjeta individual:', cardError.message)
                }
            }
            
            if (cards.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: "⚠︎ No se pudieron procesar los videos encontrados."
                }, { quoted: msg });
            }
            
            try {
                const carouselMessage = baileys.generateWAMessageFromContent(chatId, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: baileys.proto.Message.InteractiveMessage.fromObject({
                                body: baileys.proto.Message.InteractiveMessage.Body.create({
                                    text: "🥷🏻 RESULTADO DE: " + text
                                }),
                                footer: baileys.proto.Message.InteractiveMessage.Footer.create({
                                    text: dev
                                }),
                                header: baileys.proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false
                                }),
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
                    text: "⚠︎ Error al enviar el carousel. Los videos se enviarán individualmente."
                }, { quoted: msg });
                for (let i = 0; i < topResults.length; i++) {
                    const result = topResults[i]
                    try {
                        await sock.sendMessage(chatId, {
                            video: { url: result.nowm },
                            caption: `📹 *Video ${i + 1}/${topResults.length}*\n\n📝 ${result.title}\n\n${dev}`,
                            gifPlayback: false
                        }, { quoted: msg })
                        await new Promise(resolve => setTimeout(resolve, 1000))
                    } catch (e) {
                        console.error(`Error enviando video ${i + 1}:`, e.message)
                    }
                }
            }
        } catch (error) {
            console.error('Error en tiktoksearch:', error)
            await sock.sendMessage(chatId, {
                text: `⚠︎ *OCURRIÓ UN ERROR:* ${error.message}`
            }, { quoted: msg });
        }
    }
}

export default tiktokSearchCommand