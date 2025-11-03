import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const bannedFile = path.join(__dirname, '..', 'database', 'banned.json')

const handler = async (m, { conn, args, isOwner }) => {
  try {
    // Verificar si el mensaje es una respuesta
    const quoted = m.quoted || m.msg
    if (!quoted) return m.reply('🚫 Responde al mensaje del usuario que quieres banear del sistema')

    // Obtener el número del usuario mencionado
    const target = quoted.participant || quoted.sender || quoted.key.participant || quoted.key.remoteJid
    if (!target) return m.reply('❌ No se pudo obtener el número del usuario')

    // Limpiar el número (quitar @s.whatsapp.net y otros caracteres)
    const targetNumber = target.replace(/[^0-9]/g, '')
    
    try {
      // Leer archivo de baneados o crear uno nuevo
      let banned = {}
      try {
        const data = await fs.readFile(bannedFile, 'utf8')
        banned = JSON.parse(data)
      } catch (err) {
        // Si el archivo no existe, se creará uno nuevo
      }

      // Verificar si ya está baneado
      if (banned[targetNumber]) {
        return m.reply('⚠️ Este usuario ya está baneado del sistema')
      }

      // Agregar al usuario a la lista de baneados
      banned[targetNumber] = {
        date: Date.now(),
        reason: args.join(' ') || 'No especificada'
      }

      // Guardar la lista actualizada
      await fs.writeFile(bannedFile, JSON.stringify(banned, null, 2))

      await m.reply(`✅ Usuario ${targetNumber} ha sido baneado permanentemente del sistema.\n\nRazón: ${banned[targetNumber].reason}`)
      
      // Notificar al usuario baneado
      await conn.sendMessage(target, {
        text: '⛔ Has sido baneado permanentemente del sistema. Ya no podrás usar el bot.'
      })

    } catch (err) {
      console.error('Error al manejar el archivo de baneados:', err)
      throw err
    }

  } catch (error) {
    console.error('Error en bansystem:', error)
    m.reply('❌ Ocurrió un error al banear al usuario')
  }
}

handler.help = ['bansystem']
handler.tags = ['owner']
handler.command = ['bansystem']
handler.rowner = true // Solo owners pueden usar este comando

export default handler