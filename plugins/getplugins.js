import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

export default {
  name: 'getplugins',
  aliases: ['plugins', 'listplugins', 'get-plugins'],
  category: 'owner',
  description: 'Lista todos los plugins disponibles en la carpeta /plugins',
  usage: '#getplugins',
  ownerOnly: false,

  async execute(sock, msg, args) {
    try {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const pluginsDir = path.resolve(__dirname)

      // Leer archivos de la carpeta plugins (solo .js)
      const files = await fs.readdir(pluginsDir)
      const jsFiles = files.filter(f => f.endsWith('.js') && f !== path.basename(import.meta.url))

      if (jsFiles.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, { text: 'No se encontraron plugins.' }, { quoted: msg })
      }

      // Construir mensaje con lista
      let message = `📦 *Plugins disponibles* (${jsFiles.length})\n\n`
      jsFiles.sort().forEach((f, i) => {
        const name = f.replace(/\.js$/i, '')
        message += `${i + 1}. ${name}\n`
      })

      message += `\nUsa el comando con el nombre del plugin para más acciones.`

      // Si el listado es muy largo, enviarlo en varias partes (chunks)
      const chunkSize = 3000
      if (message.length <= chunkSize) {
        await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg })
      } else {
        for (let i = 0; i < message.length; i += chunkSize) {
          const part = message.slice(i, i + chunkSize)
          await sock.sendMessage(msg.key.remoteJid, { text: part }, { quoted: msg })
        }
      }

    } catch (error) {
      console.error('Error en comando getplugins:', error)
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error listando plugins. Revisa los logs.' }, { quoted: msg })
    }
  }
}
