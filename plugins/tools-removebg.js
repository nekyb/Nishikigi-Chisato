import axios from 'axios';
import FormData from 'form-data';
const removebgCommand = {
    name: 'removebg',
    aliases: ['nobg', 'rembg'],
    category: 'tools',
    description: 'Elimina el fondo de una imagen',
    usage: '#removebg [responder a una imagen o enviar imagen con caption]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const API_KEY = 'XHZ5spgQ1RPgPJHx5RfVV8V8';
        try {
            let imageBuffer = null;
            let imageMessage = msg.message?.imageMessage;
            if (!imageMessage && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                imageMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }
            if (!imageMessage) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Debes enviar una imagen o responder a una imagen con el comando:\n` +
                        `✿ Envía una imagen con caption: #removebg\n` +
                        `✿ Responde a una imagen: #removebg`
                });
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 Procesando imagen...\n\n' +
                    '⏳ Esto puede tardar unos segundos.'
            });

            try {
                imageBuffer = await sock.downloadMediaMessage(msg.message?.imageMessage ? msg :
                    { message: { imageMessage: msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage } });
            }
            catch (downloadError) {
                console.error('Error al descargar imagen:', downloadError);
                return await sock.sendMessage(chatId, {
                    text: '《✧》 Error al descargar la imagen.\n\n' +
                        '💡 *Tip:* Intenta enviar la imagen nuevamente.'
                });
            }
            if (!imageBuffer) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No se pudo obtener la imagen.'
                });
            }

            const formData = new FormData();
            formData.append('size', 'auto');
            formData.append('image_file', imageBuffer, {
                filename: 'image.jpg',
                contentType: 'image/jpeg'
            });
            await sock.sendMessage(chatId, {
                text: '《✧》 Eliminando fondo de la imagen...'
            });

            try {
                const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                    headers: {
                        'X-Api-Key': API_KEY,
                        ...formData.getHeaders()
                    },
                    responseType: 'arraybuffer',
                    timeout: 60000 
                });
                const resultBuffer = Buffer.from(response.data);
                await sock.sendMessage(chatId, {
                    image: resultBuffer,
                    caption: `《✧》 *RemoveBG* ✨\n\n` +
                        `✿ *Fondo eliminado exitosamente*\n` +
                        `✿ *Formato:* PNG con transparencia`
                }, { quoted: msg });
                await sock.sendMessage(chatId, {
                    text: `《✧》 ✅ *Proceso completado*\n\n` +
                        `💡 *Tip:* Puedes usar esta imagen como sticker o editarla.`
                });
            }
            catch (apiError) {
                console.error('Error de API remove.bg:', apiError);
                let errorMessage = '《✧》 Error al procesar la imagen.';
                if (apiError.response?.status === 403) {
                    errorMessage = '《✧》 API Key inválida o sin créditos disponibles.';
                }
                else if (apiError.response?.status === 400) {
                    errorMessage = '《✧》 La imagen no es válida o es demasiado grande.\n\n' +
                        '💡 *Tip:* Usa imágenes menores a 12MB.';
                }
                else if (apiError.response?.status === 429) {
                    errorMessage = '《✧》 Se alcanzó el límite de solicitudes.\n\n' +
                        '💡 *Tip:* Espera un momento antes de intentar nuevamente.';
                }
                else if (apiError.code === 'ECONNABORTED' || apiError.code === 'ETIMEDOUT') {
                    errorMessage = '《✧》 El procesamiento tardó demasiado.\n\n' +
                        '💡 *Tip:* Intenta con una imagen más pequeña.';
                }
                return await sock.sendMessage(chatId, {
                    text: errorMessage
                });
            }
        }
        catch (error) {
            console.error('Error en comando removebg:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Ocurrió un error inesperado al procesar la imagen.\n\n' +
                    '💡 *Tip:* Intenta nuevamente o usa una imagen diferente.'
            });
        }
    }
};
export default removebgCommand;