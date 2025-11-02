import fetch from 'node-fetch';
import { randomInt } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function isGroupAdmin(participants, jid) {
  const participant = participants.find(p => p.id === jid);
  return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
}

export function createChannelButton(text, url) {
  return {
    text,
    contextInfo: {
      externalAdReply: {
        title: "🤍 Osaka Channel",
        body: "Ver Canal",
        thumbnailUrl: "https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/igq1z44n9bn.jpg",
        sourceUrl: url || "https://whatsapp.com/channel/0029VbB9NUN3GJOrRGNzAP3i",
        mediaType: 1,
        showAdAttribution: true
      }
    }
  };
}

function createButton(text, url) {
  return createChannelButton(text, url);
}

// Command aliases mapping
export const commandAliases = {
  'ttk': 'tiktok',
  'pfp': 'getprofile',
  'yt': 'youtube',
  'ytsearch': 'youtubesearch',
  'tt': 'tiktok',
  'ig': 'instagram',
  'fb': 'facebook',
  'tw': 'twitter',
  'wa': 'whatsapp',
  'dc': 'discord'
};

export function resolveCommand(command) {
  return commandAliases[command] || command;
}

export function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

export function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function checkFileSize(url, maxSize = 10 * 1024 * 1024) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const size = parseInt(response.headers.get('content-length') || '0');
    return size <= maxSize;
  } catch (error) {
    console.error('Error checking file size:', error);
    return false;
  }
}