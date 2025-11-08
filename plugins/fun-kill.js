import axios from 'axios'
import fileType from 'file-type';
const { fileTypeFromBuffer } = fileType;

export default {
  name: 'kill',
  description: 'Mata a alguien o a ti mismo',
  category: 'fun',
  
  async execute(sock, msg, args) {
    try {
  const chatId = msg.key.remoteJid;
  const sender = msg.sender || msg.key.participant || msg.key.remoteJid || '';
  const senderName = msg.pushName || String(sender).replace(/@.*$/, '');
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      let responseText
      let mentions = []
      if (mentionedJid) {
        const mentionedName = mentionedJid.split('@')[0]
        responseText = `@${senderName} ha matado a @${mentionedName} 💀🔪`
        mentions = [sender, mentionedJid]
      } else {
        responseText = `@${senderName} se mató a sí mismo 💀`;
        mentions = [sender];
      }
      
      const deathGifs = [
        'https://i.pinimg.com/originals/7f/14/85/7f1485412d9fd0ac240f18aa25ffbd98.gif',
        'https://i.pinimg.com/originals/2f/95/25/2f95259cba6fb8fd442bd67d2d117425.gif',
        'https://i.pinimg.com/originals/30/96/e8/3096e8cff8d6e1203d5eb3825923199e.gif',
        'https://i.pinimg.com/originals/51/b7/e3/51b7e32fd2b0779a4c3ae02705b679f9.gif'
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

      let payload = {}
      if (contentType.includes('gif') || /\.gif(\?|$)/i.test(randomGif)) {
        payload = { video: buffer, gifPlayback: true, caption: responseText, mentions }
      } else if (contentType.startsWith('video/') || /\.(mp4|webm)(\?|$)/i.test(randomGif)) {
        payload = { video: buffer, caption: responseText, mentions }
      } else {
        const ext = contentType.includes('webp') ? 'webp' : (contentType.split('/')[1] || 'bin')
        payload = { document: buffer, fileName: `media.${ext}`, caption: responseText, mimetype: contentType || 'application/octet-stream', mentions }
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