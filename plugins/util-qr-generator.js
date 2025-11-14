import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';

export default {
    name: 'qr',
    aliases: ['qrcode', 'genqr'],
    category: 'utils',
    description: 'Genera códigos QR de texto, URLs, contactos, etc.',
    usage: '#qr [texto o URL]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Generador de Códigos QR*\n\n` +
                        `Uso:\n` +
                        `✿ #qr [texto] - Genera QR de texto\n` +
                        `✿ #qr [URL] - Genera QR de enlace\n\n` +
                        `Ejemplos:\n` +
                        `• #qr https://github.com\n` +
                        `• #qr Hola mundo\n` +
                        `• #qr +1234567890\n` +
                        `• #qr WIFI:T:WPA;S:MiRed;P:MiPassword;;`
                });
            }

            const content = args.join(' ');

            if (content.length > 1000) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ El texto es demasiado largo (máximo 1000 caracteres)'
                });
            }

            const qrOptions = {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 500
            };

            const qrBuffer = await QRCode.toBuffer(content, qrOptions);
            await sock.sendMessage(chatId, {
                image: qrBuffer,
                caption: `《✧》 *Código QR Generado*\n\n` +
                    `📝 *Contenido:*\n${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n\n` +
                    `💡 Escanea el código con cualquier lector QR`
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en qr:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al generar el código QR.\n\n` +
                    `Detalles: ${error.message}`
            });
        }
    }
};
