export default {
    name: 'encode',
    aliases: ['decode', 'base64', 'hex'],
    category: 'utils',
    description: 'Codifica o decodifica texto en Base64, Hex, etc.',
    usage: '#encode [tipo] [texto] o #decode [tipo] [texto]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args, command) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length < 2) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Codificador/Decodificador*\n\n` +
                        `Uso:\n` +
                        `✿ #encode [tipo] [texto]\n` +
                        `✿ #decode [tipo] [texto]\n\n` +
                        `Tipos disponibles:\n` +
                        `• base64 - Base64 encoding\n` +
                        `• hex - Hexadecimal\n` +
                        `• binary - Binario\n` +
                        `• rot13 - ROT13 cipher\n\n` +
                        `Ejemplos:\n` +
                        `• #encode base64 Hola Mundo\n` +
                        `• #decode hex 486f6c61`
                });
            }

            const type = args[0].toLowerCase();
            const text = args.slice(1).join(' ');
            const isEncode = command === 'encode';
            let result;
            switch (type) {
                case 'base64':
                    if (isEncode) {
                        result = Buffer.from(text).toString('base64');
                    } else {
                        result = Buffer.from(text, 'base64').toString('utf-8');
                    }
                    break;

                case 'hex':
                    if (isEncode) {
                        result = Buffer.from(text).toString('hex');
                    } else {
                        result = Buffer.from(text, 'hex').toString('utf-8');
                    }
                    break;

                case 'binary':
                    if (isEncode) {
                        result = text.split('').map(char => 
                            char.charCodeAt(0).toString(2).padStart(8, '0')
                        ).join(' ');
                    } else {
                        result = text.split(' ').map(bin => 
                            String.fromCharCode(parseInt(bin, 2))
                        ).join('');
                    }
                    break;

                case 'rot13':
                    result = text.replace(/[a-zA-Z]/g, char => {
                        const start = char <= 'Z' ? 65 : 97;
                        return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
                    });
                    break;

                default:
                    return await sock.sendMessage(chatId, {
                        text: '《✿》Tipo no válido. Usa: base64, hex, binary, o rot13'
                    });
            }

            await sock.sendMessage(chatId, {
                text: `《✿》 *${isEncode ? 'Codificado' : 'Decodificado'} (${type.toUpperCase()})*\n\n` +
                    `✦ *Original:*\n${text}\n\n` +
                    `✦ *Resultado:*\n${result}`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en encode/decode:', error);
            await sock.sendMessage(chatId, {
                text: `《✿》Error al ${args.includes('encode') ? 'codificar' : 'decodificar'}.\n\n` +
                    `Verifica que el texto sea válido para el formato seleccionado.`
            });
        }
    }
};
