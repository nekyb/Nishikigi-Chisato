import pkg from "@soblend/baileys";
const { makeWASocket: _makeWASocket, downloadContentFromMessage, jidNormalizedUser } = pkg;
import fs from "fs";
export function makeWASocket(connectionOptions, options = {}) {
  const sock = _makeWASocket(connectionOptions);
  sock.downloadMediaMessage = async (message) => {
    const msg = message.message || message;
    const type = Object.keys(msg)[0];
    const content = msg[type];
    if (!content) return Buffer.alloc(0);
    try {
      const stream = await downloadContentFromMessage(
        content,
        type.replace("Message", ""),
      );
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      return buffer;
    } catch (error) {
      console.error("Error descargando media:", error);
      return Buffer.alloc(0);
    }
  };
  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      return jidNormalizedUser(jid);
    }
    return jid;
  };
  sock.getName = (jid) => {
    const id = sock.decodeJid(jid);
    if (id?.endsWith("@g.us")) {
      const groupMetadata = sock.chats?.[id];
      return groupMetadata?.subject || "Grupo";
    } else {
      const contact = sock.contacts?.[id];
      return contact?.name || contact?.notify || id?.split("@")[0] || "Usuario";
    }
  };
  sock.sendFile = async (
    jid,
    path,
    filename = "",
    caption = "",
    quoted,
    options = {},
  ) => {
    let buffer;
    if (Buffer.isBuffer(path)) {
      buffer = path;
    } else if (fs.existsSync(path)) {
      buffer = fs.readFileSync(path);
    } else {
      throw new Error("Archivo no encontrado");
    }
    const mime = options.mimetype || "application/octet-stream";
    if (mime.startsWith("image/")) {
      return sock.sendMessage(
        jid,
        {
          image: buffer,
          caption: caption,
          fileName: filename,
          ...options,
        },
        { quoted },
      );
    } else if (mime.startsWith("video/")) {
      return sock.sendMessage(
        jid,
        {
          video: buffer,
          caption: caption,
          fileName: filename,
          ...options,
        },
        { quoted },
      );
    } else if (mime.startsWith("audio/")) {
      return sock.sendMessage(
        jid,
        {
          audio: buffer,
          mimetype: mime,
          fileName: filename,
          ...options,
        },
        { quoted },
      );
    } else {
      return sock.sendMessage(
        jid,
        {
          document: buffer,
          mimetype: mime,
          fileName: filename,
          caption: caption,
          ...options,
        },
        { quoted },
      );
    }
  };
  return sock;
}
export default { makeWASocket };
