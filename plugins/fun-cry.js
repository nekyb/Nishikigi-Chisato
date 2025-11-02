import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'

export default {
  name: 'cry',
  description: 'Llora por alguien',
  category: 'fun',
  
  async execute(sock, msg, args) {
    try {
      const chatId = msg.key.remoteJid
      const sender = msg.key.participant || msg.key.remoteJid
      const senderName = msg.pushName || sender.split('@')[0]
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      let responseText
      let mentions = []
      if (mentionedJid) {
        const mentionedName = mentionedJid.split('@')[0]
        responseText = `@${senderName} esta llorando por @${mentionedName} 😭`
        mentions = [sender, mentionedJid]
      } else {
        responseText = `@${senderName} esta llorando 😭`;
        mentions = [sender];
      }
      
      const deathGifs = [
        'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/6itgmgukzk3.gif',
        'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/s86ls47tujg.gif',
        'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/1pbqv2z2oyk.gif',
        'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/8w99luhn3gy.gif',
        'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/5v3gqtc50sn.gif',
        'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/gk7my7jklfo.gif',
        'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/jor8mixfih.gif'
      ];
      
      const randomGif = deathGifs[Math.floor(Math.random() * deathGifs.length)]
      const response = await axios.get(randomGif, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })
      const buffer = Buffer.from(response.data)
      const contentType = response.headers?.['content-type'] || ''

      // Enviar como GIF animado si corresponde, si no enviar como video/documento
      let payload = {}
      if (contentType.includes('gif') || /\.gif(\?|$)/i.test(randomGif)) {
        payload = {
          video: buffer,
          gifPlayback: true,
          caption: responseText,
          mentions: mentions
        }
      } else if (contentType.startsWith('video/') || /\.(mp4|webm)(\?|$)/i.test(randomGif)) {
        payload = {
          video: buffer,
          caption: responseText,
          mentions: mentions
        }
      } else {
        // Fallback a documento
        const ext = contentType.includes('webp') ? 'webp' : (contentType.split('/')[1] || 'bin')
        payload = {
          document: buffer,
          fileName: `media.${ext}`,
          caption: responseText,
          mimetype: contentType || `application/octet-stream`,
          mentions: mentions
        }
      }

      await sock.sendMessage(chatId, payload)
    } catch (error) {
      console.error('Error en comando kill:', error)
      const sender = msg.key.participant || msg.key.remoteJid
      const senderName = msg.pushName || sender.split('@')[0]
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      let fallbackText
      let mentions = []
      if (mentionedJid) {const mentionedName = mentionedJid.split('@')[0]
        fallbackText = `@${senderName} ha matado a @${mentionedName} 💀🔪\n\n_(Error al cargar el GIF)_`;
        mentions = [sender, mentionedJid]}
         else {fallbackText = `@${senderName} se mató a sí mismo 💀\n\n_(Error al cargar el GIF)_`;
        mentions = [sender]}
      await sock.sendMessage(msg.key.remoteJid, {
        text: fallbackText,
        mentions: mentions})}}}