import moment from 'moment-timezone';
export function formatPhoneNumber(number) {
    const cleaned = number.replace(/[^0-9]/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('57')) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return number;
}
export function cleanPhoneNumber(number) {
    return number.replace(/[^0-9]/g, '');
}
export function jidToNumber(jid) {
    return jid.split('@')[0];
}
export function numberToJid(number) {
    const cleaned = cleanPhoneNumber(number);
    return `${cleaned}@s.whatsapp.net`;
}
export function formatDateTime(date, format = 'DD/MM/YYYY HH:mm:ss') {
    return moment(date).tz('America/Bogota').format(format);
}
export function getRelativeTime(date) {
    moment.locale('es');
    return moment(date).fromNow();
}
export function formatDuration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0)
        parts.push(`${secs}s`);
    return parts.join(' ');
}
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
export function capitalize(text) {
    if (!text)
        return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
export function capitalizeWords(text) {
    if (!text)
        return '';
    return text.split(' ').map(word => capitalize(word)).join(' ');
}
export function truncate(text, maxLength) {
    if (!text || text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + '...';
}
export function escapeMarkdown(text) {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
export function formatList(items, bullet = '•') {
    return items.map(item => `${bullet} ${item}`).join('\n');
}
export function formatNumberedList(items) {
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}
export function createDivider(char = '─', length = 25) {
    return char.repeat(length);
}
export function createBox(title, content) {
    const divider = createDivider('═', 30);
    return `╔${divider}╗\n║ ${title.padEnd(28)} ║\n╚${divider}╝\n\n${content}`;
}
export function formatMention(jid, name) {
    // Limpia el JID removiendo sufijos @lid, @s.whatsapp.net, etc
    const number = jid.replace(/@(s\.whatsapp\.net|lid|c\.us)$/i, '');
    return `@${number}${name ? ` (${name})` : ''}`;
}
export function createTable(data, separator = ' : ') {
    const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length));
    return Object.entries(data)
        .map(([key, value]) => `${key.padEnd(maxKeyLength)}${separator}${value}`)
        .join('\n');
}
export function formatPercentage(value, total, decimals = 1) {
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
}
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function createProgressBar(current, total, length = 10) {
    const percentage = current / total;
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    const filledChar = '█';
    const emptyChar = '░';
    return `${filledChar.repeat(filled)}${emptyChar.repeat(empty)} ${formatPercentage(current, total)}`;
}
export function centerText(text, width) {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
}
export function cleanText(text) {
    return text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
export function parseMention(text) {
    if (!text) return null;

    // Extrae números de formato @123456 o 123456@s.whatsapp.net
    const jidMatch = text.match(/(\d+)@s\.whatsapp\.net/);
    if (jidMatch) {
        return jidMatch[1];
    }

    // Extrae números de formato @123456
    const atMatch = text.match(/@(\d+)/);
    if (atMatch) {
        return atMatch[1];
    }

    // Si es solo números, retorna tal cual
    if (/^\d+$/.test(text)) {
        return text;
    }

    return null;
}
export function formatCommand(command, prefix = '#') {
    return `${prefix}${command}`;
}
export function mentionToJid(number) {
    if (!number) return null;
    const cleanNumber = parseMention(number);
    return cleanNumber ? `${cleanNumber}@s.whatsapp.net` : null;
}
export function pluralize(count, singular, plural) {
    return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}
export default {
    formatPhoneNumber,
    cleanPhoneNumber,
    jidToNumber,
    numberToJid,
    formatDateTime,
    getRelativeTime,
    formatDuration,
    formatBytes,
    capitalize,
    capitalizeWords,
    truncate,
    escapeMarkdown,
    formatList,
    formatNumberedList,
    createDivider,
    createBox,
    formatMention,
    createTable,
    formatPercentage,
    formatNumber,
    createProgressBar,
    centerText,
    cleanText,
    generateId,
    parseMention,
    mentionToJid,
    formatCommand,
    pluralize
};