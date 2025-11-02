import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'

export default {
  name: 'cojer',
  description: 'Viola a alguien xd',
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
        responseText = `@${senderName} se esta cojiendo a @${mentionedName} 👀`
        mentions = [sender, mentionedJid]
      } else {
        responseText = `@${senderName} se esta cojiendo a si mismo 🥶`;
        mentions = [sender];
      }
      
      const deathGifs = [
'https://telegra.ph/file/21543bac2383ce0fc6f51.mp4',
'https://telegra.ph/file/e2beba258ba83f09a34df.mp4',
'https://telegra.ph/file/1af11cf4ffeda3386324b.mp4',
'https://telegra.ph/file/66535b909845bd2ffbad9.mp4',
'https://telegra.ph/file/6ea4ddf2f9f4176d4a5c0.mp4',
'https://telegra.ph/file/e7078700d16baad953348.mp4',
'https://telegra.ph/file/1c7d59e637f8e5915dbbc.mp4',
'https://telegra.ph/file/7638618cf43e499007765.mp4',
'https://telegra.ph/file/80aa0e43656667b07d0b4.mp4',
'https://telegra.ph/file/1baf2e8577d5118c03438.mp4',
'https://telegra.ph/file/52c82a0269bb69d5c9fc4.mp4',
'https://telegra.ph/file/34e1fb2f847cbb0ce0ea2.mp4',
'https://telegra.ph/file/249518bf45c1050926d9c.mp4',
'https://telegra.ph/file/3b1d6ef30a5e53518b13b.mp4',
'https://telegra.ph/file/100ba1caee241e5c439de.mp4',
'https://telegra.ph/file/bbf6323509d48f4a76c13.mp4',
'https://telegra.ph/file/1dec277caf371c8473c08.mp4',
'https://telegra.ph/file/216b3ab73e1d98d698843.mp4',
'https://telegra.ph/file/8e94da8d393a6c634f6f9.mp4',
'https://telegra.ph/file/ca64bfe2eb8f7f8c6b12c.mp4',
'https://telegra.ph/file/58bcc3cd79cecda3acdfa.mp4',
'https://telegra.ph/file/b08996c47ff1b38e13df0.mp4',
'https://telegra.ph/file/a91d94a51dba34dc1bed9.mp4',
'https://telegra.ph/file/bd4d5a957466eee06a208.mp4',
'https://telegra.ph/file/f8e4abb6923b95e924724.mp4',
'https://telegra.ph/file/acdb5c2703ee8390aaf33.mp4',
'https://telegra.ph/file/8be835497e63430842dfc.mp4',
'https://telegra.ph/file/89891693613651230d6f0.mp4',
'https://files.catbox.moe/cnmn0x.jpg',
'https://files.catbox.moe/xph5x5.mp4',
'https://files.catbox.moe/4ffxj8.mp4',
'https://files.catbox.moe/f6ovgb.mp4',
'https://qu.ax/XmLe.mp4',
'https://qu.ax/yiMt.mp4',
'https://qu.ax/cdKQ.mp4'
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