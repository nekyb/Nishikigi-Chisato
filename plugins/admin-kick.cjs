import { isBotAdmin, isUserAdmin } from '../lib/adminUtils.js';

const groupMetadataCache = new Map()
const lidCache = new Map()

async function resolveLidToRealJid(lid, sock, groupChatId, maxRetries = 3, retryDelay = 1000) {
    const inputJid = lid?.toString()
    if (!inputJid || !inputJid.endsWith("@lid") || !groupChatId?.endsWith("@g.us")) {
        return inputJid?.includes("@") ? inputJid : `${inputJid}@s.whatsapp.net`}
    if (lidCache.has(inputJid)) return lidCache.get(inputJid)
    const lidToFind = inputJid.split("@")[0]
    let attempts = 0
    while (attempts < maxRetries) {
        try {
            let metadata
            if (groupMetadataCache.has(groupChatId)) {
                metadata = groupMetadataCache.get(groupChatId)
            } else {
                metadata = await sock?.groupMetadata(groupChatId)
                if (metadata) {
                    groupMetadataCache.set(groupChatId, metadata)
                    setTimeout(() => groupMetadataCache.delete(groupChatId), 300000)
                }
            }
            
            if (!metadata?.participants) throw new Error("No se obtuvieron participantes")
            for (const participant of metadata.participants) {
                try {
                    if (!participant?.id) continue
                    const contactDetails = await sock?.onWhatsApp(participant.id)
                    if (!contactDetails?.[0]?.lid) continue
                    
                    const possibleLid = contactDetails[0].lid.split("@")[0]
                    if (possibleLid === lidToFind) {
                        lidCache.set(inputJid, participant.id)
                        return participant.id
                    }
                } catch (e) { 
                    continue 
                }
            }
            
            lidCache.set(inputJid, inputJid)
            return inputJid
            
        } catch (error) {
            if (++attempts >= maxRetries) {
                lidCache.set(inputJid, inputJid)
                return inputJid
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
    }
    
    return inputJid
}

async function getMentionedUserAndReason(msg, sock, text, chatId) {
    let mentionedJid = null
    let reason = null
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (mentions && mentions.length > 0) {
        mentionedJid = mentions[0]
        if (text) {
            const textAfterMention = text.replace(/@\d+/g, '').trim()
            if (textAfterMention) {
                reason = textAfterMention
            }
        }
    }
    else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const contextInfo = msg.message.extendedTextMessage.contextInfo
        mentionedJid = contextInfo.participant
        if (text && text.trim()) {
            reason = text.trim()
        }
    }
    
    if (!mentionedJid) return { user: null, reason: null }
    const resolvedJid = await resolveLidToRealJid(mentionedJid, sock, chatId)
    return { user: resolvedJid, reason: reason }
}

const kickCommand = {
    name: 'kick',
    aliases: ['expulsar', 'eliminar', 'echar', 'sacar'],
    category: 'group',
    description: 'Expulsa a un usuario del grupo',
    usage: '#kick @usuario [razón]',
    adminOnly: true,
    groupOnly: true,
    botAdminRequired: true,
    
    async execute(sock, msg, args, { groupMetadata }) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid

        // Verificar si el bot es admin
        const botIsAdmin = await isBotAdmin(sock, chatId)
        if (!botIsAdmin) {
            return await sock.sendMessage(chatId, {
                text: '❌ El bot necesita ser administrador para usar este comando.'
            }, { quoted: msg })
        }

        // Verificar si el usuario es admin
        const userIsAdmin = await isUserAdmin(sock, chatId, sender)
        if (!userIsAdmin) {
            return await sock.sendMessage(chatId, {
                text: '❌ Solo los administradores pueden usar este comando.'
            }, { quoted: msg })
        }

        if (!global.db.data.settings[sock.user.id]?.restrict) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Esta función está deshabilitada.\n\n_El administrador debe habilitar el modo *restrict* primero_'
            }, { quoted: msg })
        }
        
        const text = args.join(' ')
        const { user: mentionedUser, reason: kickReason } = await getMentionedUserAndReason(msg, sock, text, chatId)
        if (!mentionedUser) {
            return await sock.sendMessage(chatId, {
                text: `❌ Debes mencionar o responder al usuario que quieres expulsar.\n\n*Uso:* #kick @usuario [razón]\n*Ejemplo:* #kick @usuario spam`
            }, { quoted: msg })
        }
        
        if (sock.user.id.includes(mentionedUser.split('@')[0])) {
            return await sock.sendMessage(chatId, {
                text: '❌ No puedo expulsarme a mí mismo del grupo.'
            }, { quoted: msg })
        }

        if (kickReason) {
            const userTag = mentionedUser.split('@')[0]
            const reasonMessage = `╭─⬣「 🚫 *ADVERTENCIA* 🚫 」⬣
│
├❯ *Usuario:* @${userTag}
├❯ *Acción:* Expulsión del grupo
├❯ *Motivo:* ${kickReason}
├❯ *Admin:* @${sender.split('@')[0]}
│
╰─⬣ *¡Hasta luego!* ⬣`
            
            await sock.sendMessage(chatId, {
                text: reasonMessage,
                mentions: [mentionedUser, sender]
            })
            
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
        try {
            const response = await sock.groupParticipantsUpdate(chatId, [mentionedUser], 'remove')
            const userTag = mentionedUser.split('@')[0]
            if (response[0]?.status === '200') {
                await sock.sendMessage(chatId, {
                    text: `✅ Usuario @${userTag} expulsado exitosamente del grupo.`,
                    mentions: [mentionedUser]
                }, { quoted: msg })
            } else if (response[0]?.status === '406') {
                await sock.sendMessage(chatId, {
                    text: `⚠️ No se pudo expulsar a @${userTag}.\n\n_El usuario ya no está en el grupo_`,
                    mentions: [mentionedUser]
                }, { quoted: msg })
            } else if (response[0]?.status === '404') {
                await sock.sendMessage(chatId, {
                    text: `⚠️ Usuario @${userTag} no encontrado en el grupo.`,
                    mentions: [mentionedUser]
                }, { quoted: msg })
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Error desconocido al intentar expulsar al usuario.',
                    mentions: [sender]
                }, { quoted: msg })
            }
        } catch (error) {
            console.log('Error en kick:', error)
            await sock.sendMessage(chatId, {
                text: '❌ Ocurrió un error al intentar expulsar al usuario.\n\n_Verifica que el bot tenga permisos de administrador_',
                mentions: [sender]
            }, { quoted: msg })
        }
    }
}

export default kickCommand