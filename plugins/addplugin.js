import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { isOwner } from '../config/bot.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pluginsDir = path.join(__dirname)

export default {
  name: 'addplugin',
  category: 'owner',
  description: 'Crea un nuevo plugin con el código proporcionado',
  usage: '#addplugin <nombre>\n<codigo>',
  ownerOnly: true,

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid
      const sender = msg.key.participant || msg.key.remoteJid
      const senderNumber = sender.replace(/[^0-9]/g, '')
      if (!isOwner(senderNumber)) {
        await sock.sendMessage(from, { text: '❌ Solo los owners pueden usar este comando.' }, { quoted: msg })
        return}
      if (!args[0]) {
        await sock.sendMessage(from, { text: '❌ Falta el nombre del plugin' }, { quoted: msg })
        return
      }

      const name = args[0].toLowerCase()
      const fileName = name.endsWith('.js') ? name : name + '.js'
      const filePath = path.join(pluginsDir, fileName)
      let code = ''
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (quotedMsg) {
        code = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || ''
      } else {
        code = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      }

      const lines = code.split('\n')
      if (lines[0].startsWith('#addplugin')) lines.shift()
      code = lines.join('\n')
      if (!code.trim()) {
        await sock.sendMessage(from, { text: '❌ No se encontró código para el plugin' }, { quoted: msg })
        return
      }

      await fs.writeFile(filePath, code.trim(), 'utf8')
      await sock.sendMessage(from, { text: `✅ Plugin guardado como: ${fileName}` }, { quoted: msg })
    } catch (error) {
      console.error('Error en addplugin:', error)
      await sock.sendMessage(from, { text: '❌ Error al crear el plugin' }, { quoted: msg })
    }
  }
}