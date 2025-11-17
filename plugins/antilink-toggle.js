const antilinkStatus = {};

export default {
  name: 'antilink',
  aliases: ['antilink'],
  category: 'admin',
  description: 'Activa o desactiva el sistema antilink en el grupo',
  usage: '.antilink on / .antilink off',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) return await sock.sendMessage(chatId, { text: 'Este comando solo funciona en grupos.' });
    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(chatId, { text: 'Uso: .antilink on / .antilink off' });
    }

    if (args[0].toLowerCase() === 'on') {
      antilinkStatus[chatId] = true;
      await sock.sendMessage(chatId, { text: '✅ Antilink activado. Los mensajes con enlaces serán eliminados.' });
    } else {
      antilinkStatus[chatId] = false;
      await sock.sendMessage(chatId, { text: '❌ Antilink desactivado.' });
    }
  },
};

export async function onMessageDeleteLink(sock, msg) {
  const chatId = msg.key.remoteJid;
  if (!antilinkStatus[chatId]) return;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const linkRegex = /(https?:\/\/|wa\.me|chat\.whatsapp|t\.me|discord\.gg|invite|bit\.ly|youtu\.be|youtube\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|telegram\.me|joinchat|groups\.google\.com|linktr\.ee|onlyfans\.com|pornhub\.com|redtube\.com|mega\.nz|drive\.google\.com|mediafire\.com|dropbox\.com|goo\.gl|tinyurl\.com|web\.whatsapp\.com|whatsapp\.com\/invite|whatsapp\.com\/group|whatsapp\.com\/chat)/i;
  if (linkRegex.test(text)) {
    try {
      await sock.sendMessage(chatId, { delete: msg.key });
    } catch (e) {
      console.error('Error borrando mensaje con link:', e);
    }
  }
}
