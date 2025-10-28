import * as baileys from '@whiskeysockets/baileys';

const infobotCommand = {
    name: 'infobot',
    aliases: ['info', 'about', 'acerca'],
    category: 'general',
    description: 'Información sobre el bot',
    usage: '#infobot',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        const infoMessage = baileys.generateWAMessageFromContent(chatId, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: baileys.proto.Message.InteractiveMessage.create({
                        body: baileys.proto.Message.InteractiveMessage.Body.create({
                            text: '《✧》 *INFORMACIÓN DEL BOT* 《✧》\n\n' +
                                  '━━━━━━━━━━━━━━━━━━━\n\n' +
                                  'Soy *Nishikigi Chisato*, un bot desarrollado por *DeltaByte*. ' +
                                  'Mi objetivo es brindar entretenimiento, innovación y facilidad para administrar grupos de WhatsApp. ' +
                                  'Tal vez no sea el mejor, pero puedo ayudar en lo que necesites.\n\n' +
                                  '━━━━━━━━━━━━━━━━━━━\n\n' +
                                  '💡 *Características:*\n' +
                                  '✦ Descargas multimedia\n' +
                                  '✦ Búsquedas inteligentes\n' +
                                  '✦ Administración de grupos\n' +
                                  '✦ Entretenimiento\n' +
                                  '✦ Y mucho más...\n\n' +
                                  '━━━━━━━━━━━━━━━━━━━'
                        }),
                        footer: baileys.proto.Message.InteractiveMessage.Footer.create({
                            text: '© Nishikigi Chisato Bot 2025'
                        }),
                        header: baileys.proto.Message.InteractiveMessage.Header.create({
                            title: '🤖 Nishikigi Chisato',
                            subtitle: 'Bot Multifuncional',
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: baileys.proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '👨‍💻 Creador',
                                        id: 'info_creador'
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🌐 Sitio Web',
                                        url: 'https://deltabyte.com',
                                        merchant_url: 'https://deltabyte.com'
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '💬 Telegram',
                                        url: 'https://t.me/DeltaByte',
                                        merchant_url: 'https://t.me/DeltaByte'
                                    })
                                }
                            ]
                        })
                    })
                }
            }
        }, { quoted: msg });

        await sock.relayMessage(chatId, infoMessage.message, {
            messageId: infoMessage.key.id
        });
    }
};

export default infobotCommand;