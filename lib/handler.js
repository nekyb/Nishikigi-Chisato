import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { resolveCommand } from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const isGroupAdmin = (participants, userId) => {
  const participant = participants.find(p => p.id === userId)
  return participant && ['admin', 'superadmin'].includes(participant.admin)
}

export const createChannelButton = (text, url) => ({
  text,
  contextInfo: {
    externalAdReply: {
      title: text,
      body: 'Haz clic para ver más',
      thumbnail: null,
      mediaUrl: url,
      sourceUrl: url,
      mediaType: 1,
      showAdAttribution: true,
      renderLargerThumbnail: false
    }
  }
})

export class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
  }

  async loadCommands() {
    const pluginsDir = path.join(__dirname, '..', 'plugins')
    const categories = fs.readdirSync(pluginsDir)
    for (const category of categories) {
      const categoryPath = path.join(pluginsDir, category)
      if (!fs.statSync(categoryPath).isDirectory()) continue
      const files = fs.readdirSync(categoryPath)
      for (const file of files) {
        if (!file.endsWith('.js') || file.startsWith('_')) continue
        const commandPath = path.join(categoryPath, file)
        try {
          const commandModule = await import(`file://${commandPath}`)
          const command = commandModule.default || commandModule
          if (command.command) {
            this.commands.set(command.command, command)
            if (command.aliases && Array.isArray(command.aliases)) {
              command.aliases.forEach(alias => {
                this.aliases.set(alias, command.command)
              })
            }
          }
        } catch (error) {
          console.error(`❌ Error cargando plugin ${file}:`, error.message)
        }
      }
    }
  }

  getMessageText(message) {
    if (!message) return ''
    const msg = message.message || message
    if (msg.conversation) {
      return msg.conversation;
    }
    if (msg.extendedTextMessage?.text) {
      return msg.extendedTextMessage.text
    }
    if (msg.imageMessage?.caption) {
      return msg.imageMessage.caption
    }
    if (msg.videoMessage?.caption) {
      return msg.videoMessage.caption
    }
    return ''
  }

  async handleMessage(sock, message) {
    try {
      const text = this.getMessageText(message)
      if (!text || !text.startsWith('/')) return
      const args = text.slice(1).trim().split(/\s+/)
      let commandName = args.shift().toLowerCase()
      commandName = resolveCommand(commandName);
      let command = this.commands.get(commandName)

      if (!command && this.aliases.has(commandName)) {
        const resolvedCommand = this.aliases.get(commandName)
        command = this.commands.get(resolvedCommand)
      }

      if (command) {
        const chatId = message.key.remoteJid
        const sender = message.key.participant || message.key.remoteJid

        if (!sender) {
          return await sock.sendMessage(chatId, {
            text: '❌ Error: No se pudo identificar al usuario.'
          })
        }

        message.chatId = chatId
        message.sender = sender
        message.isGroup = chatId.endsWith('@g.us')

        if (command.groupOnly && !message.isGroup) {
          return await sock.sendMessage(chatId, {
            text: '❌ Este comando solo puede usarse en grupos.'
          })
        }

        if (command.adminOnly) {
          const participants = message.isGroup ? 
            await sock.groupMetadata(chatId).then(m => m.participants) : []
          const isAdmin = participants.some(p => 
            p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
          )

          if (!isAdmin) {
            return await sock.sendMessage(chatId, {
              text: '❌ Este comando es solo para administradores.'
            })
          }
        }

        await command.handler({
          sock,
          message,
          args,
          chatId,
          sender, 
          command: commandName
        })
      }
    } catch (error) {
      console.error(`Error ejecutando comando:`, error)
      console.error('Stack trace:', error.stack)
    }
  }
}