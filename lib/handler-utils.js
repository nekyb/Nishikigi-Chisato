import { areJidsSameUser } from "@neoxr/baileys"
import fileType from 'file-type'

// ===== Helpers base =====
export const clean = s => String(s || "")
  .replace(/:\d+@/, "@")
  .replace(/@lid$/i, "@s.whatsapp.net")
  .replace(/@c\.us$/i, "@s.whatsapp.net")
  .toLowerCase();

export const sameJid = (a, b) => {
  if (!a || !b) return false;
  try { if (areJidsSameUser(a, b)) return true; } catch {}
  return clean(a) === clean(b);
};

export const digitsOnly = x => String(x || "").replace(/\D/g, "");

// ===== Unwrap mensajes efímeros / viewOnce (robusto) =====
export function unwrap(m) {
  let x = m;
  while (x?.message?.ephemeralMessage || x?.message?.viewOnceMessage || x?.message?.viewOnceMessageV2) {
    x = {
      ...x,
      message:
        x.message.ephemeralMessage?.message ||
        x.message.viewOnceMessage?.message ||
        x.message.viewOnceMessageV2?.message
    };
  }
  if (x?.message?.documentWithCaptionMessage?.message) {
    x = { ...x, message: x.message.documentWithCaptionMessage.message };
  }
  return x;
}

// ===== Texto / menciones =====
export function pickText(m) {
  const msg = m.message || {};
  return msg.conversation
      || msg.extendedTextMessage?.text
      || msg.imageMessage?.caption
      || msg.videoMessage?.caption
      || msg.documentMessage?.caption
      || msg.documentWithCaptionMessage?.message?.documentMessage?.caption
      || "";
}

export function getMentionedJid(m) {
  const ci = m.message?.extendedTextMessage?.contextInfo
          || m.message?.imageMessage?.contextInfo
          || m.message?.videoMessage?.contextInfo
          || m.message?.documentMessage?.contextInfo
          || m.message?.stickerMessage?.contextInfo
          || m.message?.audioMessage?.contextInfo
          || m.message?.contextInfo
          || {};
  return ci.mentionedJid || [];
}

// ===== Construcción robusta de m.quoted =====
export function extractQuoted(m) {
  const msg = m.message || {};
  const ctx =
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    msg.stickerMessage?.contextInfo ||
    msg.audioMessage?.contextInfo ||
    msg.contactMessage?.contextInfo ||
    msg.liveLocationMessage?.contextInfo ||
    msg.buttonsMessage?.contextInfo ||
    msg.templateMessage?.contextInfo ||
    msg.interactiveResponseMessage?.contextInfo ||
    null;

  if (!ctx) return null;

  const q = {
    key: {
      id: ctx.stanzaId || ctx.stanzaID || undefined,
      remoteJid: ctx.remoteJid || m.key?.remoteJid,
      participant: ctx.participant || undefined
    },
    sender: ctx.participant || ctx.remoteJid || "",
    participant: ctx.participant || ""
  };

  if (ctx.quotedMessage) q.message = ctx.quotedMessage;
  return q;
}

// ===== Cache metadata de grupo =====
const groupCache = new Map(); // chatId -> { ts, data }

export async function getGroupMetaCached(conn, chatId, ttlMs = 10_000) {
  const now = Date.now();
  const hit = groupCache.get(chatId);
  if (hit && (now - hit.ts) < ttlMs) return hit.data;
  try {
    const md = await conn.groupMetadata(chatId);
    groupCache.set(chatId, { ts: now, data: md });
    return md;
  } catch {
    const empty = { id: chatId, subject: "", participants: [] };
    groupCache.set(chatId, { ts: now, data: empty });
    return empty;
  }
}

// ===== Helpers para envío de archivos =====
export async function sendFile(conn, jid, input, filename = '', caption = '', quoted, options = {}) {
  let payload = {};
  if (Buffer.isBuffer(input)) {
    const t = await fileType.fromBuffer(input).catch(() => null);
    const mime = t?.mime || '';
    if (/webp/i.test(mime))         payload = { sticker: input };
    else if (/image\//i.test(mime)) payload = { image: input, caption };
    else if (/video\//i.test(mime)) payload = { video: input, caption };
    else if (/audio\//i.test(mime)) payload = { audio: input };
    else                            payload = { document: input, fileName: filename || 'file', mimetype: mime || 'application/octet-stream' };
  } else {
    payload = { document: { url: input }, fileName: filename || 'file', caption };
  }
  return conn.sendMessage(jid, payload, { quoted, ...options });
}

// Lista blanca de comandos sin registro
export const NO_REG_CMDS = new Set([
  "help","ayuda","intro","presentacion","presentación","menu","menú","reg","register","verificar",
  // gacha:
  "rw","drop","waifu","husbando",
  "c","reclamar","claim",
  "harem","claims","waifus","waifu",
  "topwaifus","topclaims","topwaifu",
  "wimage","waifuimage","wimg","cimage","charimage",
  "serielist","serieslist","listaseri","listas","listaseries",
  "totalcharacters","totals","totalwaifus","waifucount",
  "estadisticaspersonajes","resumenchars","totalchars","totalpersonajes","characters","listcharacters","listapersonajes",
  // stickers:
  "s","sticker",
  // economía:
  "w","work","trabajar",
  "billetera","wallet","cartera",
  "baltop","eboard",
  // util:
  "code"
]);