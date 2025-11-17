import { isGroupAdmin, createChannelButton } from '../lib/handler.js'
import { isOwner } from '../config/bot.js'
import { isBotAdmin, isUserAdmin } from '../lib/adminUtils.js'

export default {
  command: 'ban',
  description: 'Banea a un usuario del grupo',
  category: 'grupos',
  async handler({ sock, message, args, chatId, sender, isGroup, botNumber }) {
    if (!isGroup) return

    try {
      const groupMetadata = await sock.groupMetadata(chatId)
      const participants = groupMetadata.participants
      
      const botIsAdmin = await isBotAdmin(sock, chatId)
      if (!botIsAdmin) {
        return sock.sendMessage(chatId, createChannelButton(
          "૮₍˃̵֊ ˂̵ ₎ა Lo siento, no soy administrador en este grupo."
        ))
      }

      const userIsAdmin = await isUserAdmin(sock, chatId, sender)
      if (!userIsAdmin) {
        await sock.sendMessage(chatId, { 
          text: 'ꕤ Solo los administradores pueden usar este comando'
        })
        return
      }

      let userToBan = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      
      if (!userToBan && message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant
      }

      if (!userToBan) {
        await sock.sendMessage(chatId, { 
          text: 'ꕤ Debes mencionar o responder al mensaje de un usuario para banearlo\nEjemplo: /ban @usuario'
        })
        return
      }

      if (userToBan === botNumber) {
        await sock.sendMessage(chatId, { 
          text: 'ꕤ No puedo banearme a mí mismo del grupo'
        })
        return
      }

      const ownerGroup = groupMetadata.owner || chatId.split('-')[0] + '@s.whatsapp.net'
      if (userToBan === ownerGroup) {
        await sock.sendMessage(chatId, { 
          text: 'ꕤ No puedo banear al propietario del grupo'
        })
        return
      }

      const targetNumber = userToBan.split('@')[0]
      if (isOwner(targetNumber)) {
        await sock.sendMessage(chatId, { 
          text: 'ꕤ No puedo banear al propietario del bot'
        })
        return
      }

      const isTargetAdmin = isGroupAdmin(participants, userToBan)
      const senderNumber = sender.split('@')[0]
      const isCommanderOwner = sender === ownerGroup || isOwner(senderNumber)
      
      if (isTargetAdmin && !isCommanderOwner) {
        await sock.sendMessage(chatId, { 
          text: 'ꕤ Solo el owner del grupo puede banear a un administrador'
        })
        return
      }

      const participant = participants.find(p => p.id === userToBan)
      if (!participant) {
        await sock.sendMessage(chatId, { 
          text: 'ꕤ El usuario no se encuentra en el grupo'
        })
        return
      }

      await sock.sendMessage(chatId, { 
        text: `🔨 Usuario @${targetNumber} ha sido baneado del grupo`,
        mentions: [userToBan]
      })

      const response = await sock.groupParticipantsUpdate(chatId, [userToBan], 'remove')
      
      if (response[0]?.status === '404') {
        await sock.sendMessage(chatId, {
          text: 'ꕤ No se pudo encontrar al usuario en el grupo'
        })
      } else if (response[0]?.status !== '200') {
        await sock.sendMessage(chatId, {
          text: 'ꕤ Hubo un problema al banear al usuario'
        })
      }
      
    } catch (error) {
      console.error('Error en ban:', error)
      await sock.sendMessage(chatId, { 
        text: 'ꕤ Ocurrió un error al intentar banear al usuario'
      })
    }
  }
}