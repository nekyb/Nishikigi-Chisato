import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';

export default {
  name: 'kill',
  description: 'Mata a alguien o a ti mismo',
  category: 'fun',
  
  async execute(sock, msg, args) {
    try {
      const chatId = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderName = msg.pushName || sender.split('@')[0];
      
      // Verificar si hay una mención
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      
      let responseText;
      let mentions = [];
      
      if (mentionedJid) {
        // Si mencionó a alguien
        const mentionedName = mentionedJid.split('@')[0];
        responseText = `@${senderName} ha matado a @${mentionedName} 💀🔪`;
        mentions = [sender, mentionedJid];
      } else {
        // Si no mencionó a nadie, se mata a sí mismo
        responseText = `@${senderName} se mató a sí mismo 💀`;
        mentions = [sender];
      }
      
      // Lista de GIFs de anime death (URLs actualizadas y verificadas)
      const deathGifs = [
        'https://i.pinimg.com/originals/7f/14/85/7f1485412d9fd0ac240f18aa25ffbd98.gif',
        'https://i.pinimg.com/originals/2f/95/25/2f95259cba6fb8fd442bd67d2d117425.gif',
        'https://i.pinimg.com/originals/30/96/e8/3096e8cff8d6e1203d5eb3825923199e.gif',
        'https://i.pinimg.com/originals/51/b7/e3/51b7e32fd2b0779a4c3ae02705b679f9.gif'
      ];
      
      // Seleccionar un GIF aleatorio
      const randomGif = deathGifs[Math.floor(Math.random() * deathGifs.length)];
      
      // Descargar el GIF
      const response = await axios.get(randomGif, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const buffer = Buffer.from(response.data);
      
      // Verificar el tipo de archivo
      const fileType = await fileTypeFromBuffer(buffer);
      
      if (!fileType || !fileType.mime.startsWith('image/')) {
        throw new Error('El archivo descargado no es una imagen válida');
      }
      
      // Enviar el GIF con el mensaje
      await sock.sendMessage(chatId, {
        video: buffer,
        caption: responseText,
        mentions: mentions,
        gifPlayback: true,
        ptv: false
      });
      
    } catch (error) {
      console.error('Error en comando kill:', error);
      
      // Mensaje de fallback sin GIF
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderName = msg.pushName || sender.split('@')[0];
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      
      let fallbackText;
      let mentions = [];
      
      if (mentionedJid) {
        const mentionedName = mentionedJid.split('@')[0];
        fallbackText = `@${senderName} ha matado a @${mentionedName} 💀🔪\n\n_(Error al cargar el GIF)_`;
        mentions = [sender, mentionedJid];
      } else {
        fallbackText = `@${senderName} se mató a sí mismo 💀\n\n_(Error al cargar el GIF)_`;
        mentions = [sender];
      }
      
      await sock.sendMessage(msg.key.remoteJid, {
        text: fallbackText,
        mentions: mentions
      });
    }
  }
};