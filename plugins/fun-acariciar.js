import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type';

export default {
  name: 'pat',
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
        responseText = `@${senderName} esta acariciando a @${mentionedName} 🥰`
        mentions = [sender, mentionedJid]
      } else {
        responseText = `@${senderName} esta acariciando a 🥰`;
        mentions = [sender];
      }
      
      const deathGifs = [
        'https://telegra.ph/file/f75aed769492814d68016.mp4',
'https://telegra.ph/file/4f24bb58fe580a5e97b0a.mp4',
'https://telegra.ph/file/30206abdcb7b8a4638510.mp4',
'https://telegra.ph/file/ecd7aeae5b2242c660d41.mp4',
'https://telegra.ph/file/6d3ba201bcdd1fd2c1408.mp4',
'https://telegra.ph/file/d5dbdcf845d2739dbe45e.mp4',
'https://telegra.ph/file/c9a529908d4e0b71d7c5a.mp4',
'https://telegra.ph/file/b7bc277ddef1af913827c.mp4',
'https://telegra.ph/file/8b01e180dfb7e98d5a4f8.mp4',
'https://telegra.ph/file/901f13852aa65f9628d96.mp4'

      ];
      
      const randomGif = deathGifs[Math.floor(Math.random() * deathGifs.length)]
      const response = await axios.get(randomGif, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000})
      const buffer = Buffer.from(response.data)
      const fileType = await fileTypeFromBuffer(buffer)
      if (!fileType || !fileType.mime.startsWith('image/')) {throw new Error('El archivo descargado no es una imagen válida');}
      await sock.sendMessage(chatId, {
        video: buffer,
        caption: responseText,
        mentions: mentions,
        gifPlayback: true,
        ptv: false
      })
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