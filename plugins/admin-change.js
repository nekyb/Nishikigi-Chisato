import { hasImage, downloadMedia } from '../handlers/messages.js'

const changeCommand = {
    name: 'change',
    aliases: ['cambiar', 'modificar'],
    category: 'admin',
    description: 'Cambia la descripción, nombre o imagen del grupo',
    usage: '#change description/name/image [texto]',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: true,
    async execute(sock, msg, args) {
        const chatId = msg.sender;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso ıncorrecto del comαndo*\n\n` +
                        `Ejemplos:\n` +
                        `✿ #chαnge descrıptıon [texto] - Cαmbıα lα descrıpcıón\n` +
                        `✿ #chαnge nαme [texto] - Cαmbıα el nombre\n` +
                        `✿ #chαnge ımαge - Responde α unα ımαgen pαrα cαmbıαrlα`
                });
            }
            const action = args[0].toLowerCase()
            switch (action) {
                case 'description':
                case 'desc':
                case 'descripcion':
                    await handleDescriptionChange(sock, msg, args.slice(1), chatId)
                    break;
                case 'name':
                case 'nombre':
                    await handleNameChange(sock, msg, args.slice(1), chatId)
                    break;
                case 'image':
                case 'imagen':
                case 'foto':
                case 'picture':
                    await handleImageChange(sock, msg, chatId)
                    break
                default:
                    await sock.sendMessage(chatId, {
                        text: `《✧》 *Opcıón no vάlıdα*\n\n` +
                            `Opcıones dısponıbles:\n` +
                            `✿ descrıptıon - Cαmbıα lα descrıpcıón\n` +
                            `✿ nαme - Cαmbıα el nombre\n` +
                            `✿ ımαge - Cαmbıα lα ımαgen del grupo`
                    })
                    break
            }
        } catch (error) {
            console.error('Error en comando change:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》Ocurrıó un error αl ıntentαr cαmbıαr lα confıgurαcıón del grupo'
            })
        }
    }
}

async function handleDescriptionChange(sock, msg, args, chatId) {
    if (args.length === 0) {
        return await sock.sendMessage(chatId, {
            text: '《✧》Debes especıfıcαr lα nuevα descrıpcıón\nEjemplo: #chαnge descrıptıon Bıenvenıdos αl grupo'
        })
    }
    const newDescription = args.join(' ')
    try {
        await sock.groupUpdateDescription(chatId, newDescription)
        await sock.sendMessage(chatId, {
            text: `《✧》*Descrıpcıón del grupo αctuαlızαdα*\n\n📄 Nuevα descrıpcıón:\n${newDescription}`
        })
    } catch (error) {
        console.error('Error cambiando descripción:', error)
        await sock.sendMessage(chatId, {
            text: '《✧》No se pudo cαmbıαr lα descrıpcıón del grupo'
        })
    }
}

async function handleNameChange(sock, msg, args, chatId) {
    if (args.length === 0) {
        return await sock.sendMessage(chatId, {
            text: '《✧》Debes especıfıcαr el nuevo nombre\nEjemplo: #chαnge nαme Grupo de Nose.'
        })
    }
    const newName = args.join(' ')
    if (newName.length > 25) {
        return await sock.sendMessage(chatId, {
            text: '《✧》El nombre del grupo no puede tener mάs de 25 cαrαcteres.'
        })
    }

    try {
        await sock.groupUpdateSubject(chatId, newName)
        await sock.sendMessage(chatId, {
            text: `《✧》 *Nombre del grupo actualizado*\n\n📝 Nuevo nombre: ${newName}`
        })
    } catch (error) {
        console.error('Error cambiando nombre:', error);
        await sock.sendMessage(chatId, {
            text: '《✧》 No se pudo cambiar el nombre del grupo'
        })
    }
}

async function handleImageChange(sock, msg, chatId) {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const hasQuotedImage = quotedMsg?.imageMessage
    if (!hasQuotedImage && !hasImage(msg)) {
        return await sock.sendMessage(chatId, {
            text: '《✧》 Debes responder a una imagen con el comando #change image'
        })
    }

    try {
        await sock.sendMessage(chatId, {
            text: '《✧》 Cambiando la imagen del grupo...'
        })

        let imageBuffer = null
        if (hasQuotedImage) {
            const quotedImage = {
                message: quotedMsg,
                key: msg.message.extendedTextMessage.contextInfo
            }
            imageBuffer = await sock.downloadMediaMessage(quotedImage)
        } else if (hasImage(msg)) {
            imageBuffer = await downloadMedia(sock, msg)
        } if (!imageBuffer) {
            return await sock.sendMessage(chatId, {
                text: '《✧》 No se pudo descargar la imagen'
            })
        } await sock.updateProfilePicture(chatId, imageBuffer)
        await sock.sendMessage(chatId, {
            text: '《✧》 *Imagen del grupo actualizada exitosamente* 📸'
        })
    } catch (error) {
        console.error('Error cambiando imagen:', error)
        await sock.sendMessage(chatId, {
            text: '《✧》o se pudo cambiar la imagen del grupo. Asegúrate de que la imagen sea válida.'})}}
export default changeCommand