const profileCommand = {
    name: 'profile',
    aliases: ['pfp', 'pp'],
    category: 'general',
    description: 'Muestra la foto de perfil de un usuario',
    usage: '#profile @usuario o #pfp @usuario',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            let targetUser;
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid &&
                msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
                targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.quoted && msg.quoted.participant) {
                targetUser = msg.quoted.participant;
            } else {
                targetUser = msg.sender;
            }
            
            try {
                let profilePicUrl;
                
                try {
                    profilePicUrl = await sock.profilePictureUrl(targetUser, 'image');
                } catch (err) {
                    if (err.output?.statusCode === 404 || err.message?.includes('not found') || err.message?.includes('item-not-found')) {
                        await sock.sendMessage(chatId, {
                            text: '《✧》 Este usuario no tiene foto de perfil'
                        }, { quoted: msg })
                        return
                    }
                    throw err;
                }
                
                if (!profilePicUrl) {
                    await sock.sendMessage(chatId, {
                        text: '《✧》 No se pudo obtener la foto de perfil'
                    }, { quoted: msg })
                    return
                }
                
                const userName = targetUser.split('@')[0];
                const response = await fetch(profilePicUrl);
                const buffer = await response.arrayBuffer();
                const imageBuffer = Buffer.from(buffer);
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: `┏━━━━━━━━━━━━━━━┓
┃ ✩ 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𝐈𝐍𝐅𝐎 ┃
┃
┃ ✩ Usuario: @${userName}
┗━━━━━━━━━━━━━━━┛`,
                    mentions: [targetUser],
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363421377964290@newsletter",
                            newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                            serverMessageId: 1,
                        },
                    },
                }, { quoted: msg })
                
            } catch (error) {
                if (error.output?.statusCode === 404 || error.message?.includes('not found') || error.message?.includes('item-not-found')) {
                    await sock.sendMessage(chatId, {
                        text: '《✧》 Este usuario no tiene foto de perfil'
                    }, { quoted: msg })
                } else {
                    throw error;
                }
            }
            
        } catch (error) {
            console.error('Error en comando profile:', error)
            await sock.sendMessage(chatId, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            })
            
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al obtener la foto de perfil'
            }, { quoted: msg })
        }
    }
}

export default profileCommand