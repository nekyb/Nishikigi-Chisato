import axios from 'axios'
import FormData from 'form-data'
import { downloadMediaMessage } from '@neoxr/baileys'
import sharp from 'sharp'

const delinearCommand = {
    name: 'delinear',
    aliases: ['lineart', 'outline', 'calcar', 'reliniar'],
    category: 'image',
    description: 'Convierte una imagen a dibujo de líneas (line art)',
    usage: '#delinear [responde a una imagen o envía imagen con caption]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMessage = msg.message?.imageMessage || quotedMsg?.imageMessage;
            
            if (!imageMessage) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Delineador de Imágenes* 《✧》\n\n` +
                        `Convierte cualquier imagen en un dibujo de líneas.\n\n` +
                        `*Uso:*\n` +
                        `✿ Envía una imagen con el caption: #delinear\n` +
                        `✿ Responde a una imagen con: #delinear\n\n` +
                        `🎨 *Resultado:* Solo las líneas del dibujo (line art)`
                });
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 🎨 Delineando imagen...\n⏳ Esto puede tomar unos segundos...'
            });

            const buffer = await downloadMediaMessage(
                quotedMsg || msg,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            console.log('Imagen descargada:', buffer.length, 'bytes');

            let processedImage = null;
            let method = '';

            try {
                processedImage = await processWithReplicate(buffer);
                method = 'Replicate AI';
            } catch (error) {
                console.log('Replicate falló, intentando alternativa...');
   
                try {
                    processedImage = await processWithClipdrop(buffer);
                    method = 'ClipDrop AI';
                } catch (error2) {
                    console.log('ClipDrop falló, usando procesamiento local...');
                    
                    processedImage = await processLocalLineArt(buffer);
                    method = 'Procesamiento Local';
                }
            }

            if (!processedImage) {
                throw new Error('No se pudo procesar la imagen con ningún método');
            }


            await sock.sendMessage(chatId, {
                image: processedImage,
                caption: `《✧》 *Imagen Delineada* 《✧》\n\n` +
                    `✨ Conversión completada\n` +
                    `🎨 Line art generado exitosamente\n` +
                    `🔧 Método: ${method}\n` +
                    `> _*By Soblend | Development Studio Creative*_`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en delinear:', error);
            
            let errorMessage = '《✧》 ❌ Error al procesar la imagen\n\n';
            
            if (error.message?.includes('timeout')) {
                errorMessage += '⏱️ El procesamiento tardó demasiado.\n' +
                    '💡 Intenta con una imagen más pequeña.';
            } else if (error.message?.includes('token') || error.message?.includes('api')) {
                errorMessage += '🔑 Error de configuración de API.\n' +
                    '💡 Verifica las API keys configuradas.';
            } else if (error.message?.includes('network')) {
                errorMessage += '🌐 Error de conexión.\n' +
                    '💡 Verifica tu internet.';
            } else {
                errorMessage += `💡 Error: ${error.message || 'Desconocido'}\n\n` +
                    `📝 Asegúrate de:\n` +
                    `• Enviar una imagen válida (JPG, PNG)\n` +
                    `• La imagen no sea muy pesada (max 5MB)\n` +
                    `• Tener buena conexión a internet`;
            }
            
            await sock.sendMessage(chatId, { text: errorMessage })
        }
    }
}

async function processWithReplicate(imageBuffer) {
    const REPLICATE_TOKEN = 'TU_REPLICATE_TOKEN'; // Obtener en replicate.com
    
    if (!REPLICATE_TOKEN || REPLICATE_TOKEN === 'TU_REPLICATE_TOKEN') {
        throw new Error('Token de Replicate no configurado');
    }

    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
            version: '854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b',
            input: {
                image: base64Image,
                processor: 'lineart'
            }
        },
        {
            headers: {
                'Authorization': `Token ${REPLICATE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        }
    );

    const predictionId = response.data.id;

    let result = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await axios.get(
            `https://api.replicate.com/v1/predictions/${predictionId}`,
            {
                headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` }
            }
        )

        if (statusResponse.data.status === 'succeeded') {
            result = statusResponse.data.output;
            break;
        } else if (statusResponse.data.status === 'failed') {
            throw new Error('Procesamiento falló en Replicate')
        }
    }

    if (!result) {
        throw new Error('Timeout esperando resultado de Replicate')
    }

    const imageResponse = await axios.get(result, {
        responseType: 'arraybuffer'
    })

    return Buffer.from(imageResponse.data);
}

async function processWithClipdrop(imageBuffer) {
    const CLIPDROP_KEY = '1a936d1e2f23decaa0638273e4ac65c754194792c360f79de928e992ce2791029f0f19bfc15aa37a061ff6a5a465c999'; // Obtener en clipdrop.co/apis
    
    if (!CLIPDROP_KEY || CLIPDROP_KEY === '1a936d1e2f23decaa0638273e4ac65c754194792c360f79de928e992ce2791029f0f19bfc15aa37a061ff6a5a465c999') {
        throw new Error('API key de ClipDrop no configurada');
    }

    const formData = new FormData();
    formData.append('image_file', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
    });

    const response = await axios.post(
        'https://clipdrop-api.co/sketch-to-image/v1/sketch-to-image',
        formData,
        {
            headers: {
                ...formData.getHeaders(),
                'x-api-key': CLIPDROP_KEY
            },
            responseType: 'arraybuffer',
            timeout: 60000
        }
    );

    return Buffer.from(response.data);
}

async function processLocalLineArt(imageBuffer) {
    try {
        const processed = await sharp(imageBuffer)
            .greyscale()
            .normalize()
            .linear(1.5, -(128 * 0.5)) 
            .threshold(128) 
            .negate() 
            .png()
            .toBuffer();

        const final = await sharp(processed)
            .blur(0.3)
            .threshold(200)
            .negate()
            .png()
            .toBuffer();

        return final;
        
    } catch (error) {
        console.error('Error en procesamiento local:', error);
        throw new Error('No se pudo procesar localmente la imagen');
    }
}

export default delinearCommand;