export default {
    name: 'reverse',
    aliases: ['invertir', 'rev'],
    category: 'utils',
    description: 'Invierte texto o lo convierte a diferentes formatos',
    usage: '#reverse [texto]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Text Reverser*\n\n` +
                        `Uso: #reverse [texto]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #reverse Hola Mundo\n` +
                        `✿ #reverse 12345`
                });
            }

            const text = args.join(' ');
            const reversed = text.split('').reverse().join('');
            const upsideDown = text.split('').map(char => {
                const map = {
                    'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ',
                    'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ',
                    'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o',
                    'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ',
                    'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ',
                    'z': 'z', 'A': '∀', 'B': 'q', 'C': 'Ɔ', 'D': 'p',
                    'E': 'Ǝ', 'F': 'Ⅎ', 'G': '⅁', 'H': 'H', 'I': 'I',
                    'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N',
                    'O': 'O', 'P': 'Ԁ', 'Q': 'Ὸ', 'R': 'ɹ', 'S': 'S',
                    'T': '⊥', 'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X',
                    'Y': '⅄', 'Z': 'Z', '?': '¿', '!': '¡', '.': '˙',
                    ',': '\'', '\'': ',', '"': ',,', '(': ')', ')': '(',
                    '[': ']', ']': '[', '{': '}', '}': '{'
                };
                return map[char] || char;
            }).reverse().join('');

            const mirror = text.split('').map(char => {
                const map = {
                    'a': 'ɒ', 'b': 'd', 'c': 'ɔ', 'd': 'b', 'e': 'ɘ',
                    'f': 'ʇ', 'g': 'ǫ', 'h': 'ʜ', 'i': 'i', 'j': 'ſ',
                    'k': 'ʞ', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o',
                    'p': 'q', 'q': 'p', 'r': 'ɿ', 's': 's', 't': 't',
                    'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x', 'y': 'ʏ',
                    'z': 'z'
                };
                return map[char] || char;
            }).join('');

            await sock.sendMessage(chatId, {
                text: `《✧》 *Text Reverser*\n\n` +
                    `📝 *Original:*\n${text}\n\n` +
                    `🔄 *Invertido:*\n${reversed}\n\n` +
                    `🙃 *Al revés:*\n${upsideDown}\n\n` +
                    `🪞 *Espejo:*\n${mirror}`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en reverse:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Error al invertir texto.'
            });
        }
    }
};
