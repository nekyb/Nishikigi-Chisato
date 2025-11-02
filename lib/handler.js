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
            console.log(`✅ Plugin cargado: ${command.command} (${path.basename(file, '.js')})`)
            if (command.aliases && Array.isArray(command.aliases)) {
              command.aliases.forEach(alias => {
                this.aliases.set(alias, command.command)
                console.log(`  └─ Alias: ${alias} -> ${command.command}`)
              })
            }
          }
        } catch (error) {
          console.error(`❌ Error cargando plugin ${file}:`, error.message)
          if (error.stack) {
            console.error(error.stack)
          }
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
      console.log(`📝 Comando recibido: /${commandName}`, args)
      commandName = resolveCommand(commandName);
      console.log(`[DEBUG] Comando resuelto: ${commandName}`)
      let command = this.commands.get(commandName)
      console.log(`[DEBUG] Comando encontrado: ${command ? command.command : 'Ninguno'}`)
      if (!command && this.aliases.has(commandName)) {
        const resolvedCommand = this.aliases.get(commandName)
        console.log(`🔄 Usando alias: ${commandName} -> ${resolvedCommand}`)
        command = this.commands.get(resolvedCommand)
        console.log(`[DEBUG] Comando resuelto por alias: ${command ? command.command : 'Ninguno'}`)
      }
      
      if (command) {
        const chatId = message.key.remoteJid
        const sender = message.key.participant || message.key.remoteJid
        console.log(`[DEBUG] Chat ID: ${chatId}`)
        console.log(`[DEBUG] Sender: ${sender}`)
        console.log(`[DEBUG] Message key:`, JSON.stringify(message.key, null, 2))
        if (!sender) {
          console.error('❌ No se pudo extraer el sender del mensaje')
          return await sock.sendMessage(chatId, {
            text: '❌ Error: No se pudo identificar al usuario.'
          })
        }
        
        message.chatId = chatId
        message.sender = sender
        message.isGroup = chatId.endsWith('@g.us')
        console.log(`[DEBUG] Es grupo: ${message.isGroup}`)
        if (command.groupOnly && !message.isGroup) {
          console.log(`[DEBUG] Comando ${command.command} es solo para grupos, pero no es un grupo.`);
          return await sock.sendMessage(chatId, {
            text: '❌ Este comando solo puede usarse en grupos.'
          })
        }
        
        if (command.adminOnly) {
          console.log(`[DEBUG] Comando ${command.command} requiere admin.`)
          const participants = message.isGroup ? 
            await sock.groupMetadata(chatId).then(m => m.participants) : []
          const isAdmin = participants.some(p => 
            p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
          )
          console.log(`[DEBUG] Es admin: ${isAdmin}`) 
          if (!isAdmin) {
            return await sock.sendMessage(chatId, {
              text: '❌ Este comando es solo para administradores.'
            })
          }
        }
        
        console.log(`▶️ Ejecutando comando: /${commandName}`)
        await command.handler({
          sock,
          message,
          args,
          chatId,
          sender, 
          command: commandName
        })
        console.log(`[DEBUG] Comando ${command.command} ejecutado.`)
      } else {
        console.log(`[DEBUG] Comando ${commandName} no encontrado.`)
      }
    } catch (error) {
      console.error(`Error ejecutando comando:`, error)
      console.error('Stack trace:', error.stack)
    }
  }
}