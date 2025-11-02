import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'

export default {
  name: 'kiss',
  description: 'Besa a alguien',
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
        responseText = `@${senderName} esta besando a @${mentionedName} 😘`
        mentions = [sender, mentionedJid]
      } else {
        responseText = `@${senderName} se esta besando a si mismo 😘`;
        mentions = [sender];
      }
      
      const deathGifs = [
'https://telegra.ph/file/d6ece99b5011aedd359e8.mp4',
'https://telegra.ph/file/ba841c699e9e039deadb3.mp4',
'https://telegra.ph/file/6497758a122357bc5bbb7.mp4',
'https://telegra.ph/file/8c0f70ed2bfd95a125993.mp4',
'https://telegra.ph/file/826ce3530ab20b15a496d.mp4'
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