import axios from 'axios';
const HEYGEN_API_KEY = 'sk_V2_hgu_khmNxKR2d7l_NpUnMdfNTYUiaJq12uYaIwGknp9rGkQw';
const DEFAULT_AVATAR = 'Daisy-inskirt-20220818'; 
const DEFAULT_VOICE = '2d5b0e6cf36f460aa7fc47e3eee4ba54'; 
const heygenCommand = {
    name: 'heygen',
    aliases: ['genvideo', 'texttovideo', 'makevideo'],
    category: 'tools',
    description: 'Genera videos con IA usando texto. Convierte tus ideas en videos con avatares realistas',
    usage: '#heygen [tu texto para el video]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *HeyGen AI - Text to Video* 《✧》\n\n` +
                        `Convierte texto en videos con avatares IA realistas.\n\n` +
                        `*Uso:*\n` +
                        `✿ #heygen [tu texto]\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #heygen Hola, soy un avatar de inteligencia artificial. Puedo ayudarte a crear videos increíbles.\n` +
                        `✿ #heygen Bienvenido a nuestro canal. Hoy aprenderemos sobre IA.\n` +
                        `✿ #heygen Este es un mensaje importante para todos nuestros usuarios.\n\n` +
                        `💡 *Límites:*\n` +
                        `- Máximo 1500 caracteres\n` +
                        `- El video tarda 1-3 minutos en generarse\n` +
                        `- Los videos gratuitos tienen marca de agua`
                });
            }
            const text = args.join(' ');
            if (text.length > 1500) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ El texto es muy largo\n\n' +
                        `Tu texto tiene ${text.length} caracteres.\n` +
                        `El límite es 1500 caracteres.\n\n` +
                        `Por favor acorta tu mensaje.`
                });
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 *Generando video con HeyGen AI...*\n\n' +
                    `📝 Texto: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n` +
                    `🎬 Avatar: Daisy\n` +
                    `🔊 Voz: Femenino (Inglés)\n\n` +
                    `⏳ Esto puede tardar 1-3 minutos...\n` +
                    `Por favor espera, no envíes otro comando.`
            });

            const videoId = await createVideo(text);
            const videoUrl = await waitForVideo(videoId, sock, chatId);
            const videoBuffer = await downloadVideo(videoUrl);
            await sock.sendMessage(chatId, {
                video: videoBuffer,
                caption: `《✧》 *Video generado exitosamente* 《✧》\n\n` +
                    `📝 Texto: "${text.substring(0, 150)}${text.length > 150 ? '...' : ''}"\n` +
                    `🎬 Generado con HeyGen AI\n` +
                    `⚡ Powered by Genesis Bot`,
                mimetype: 'video/mp4'
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando heygen:', error);
            let errorMessage = '《✧》 Error al generar el video\n\n';
            if (error.message.includes('quota')) {
                errorMessage += '❌ Cuota de API agotada\n\n' +
                    'El límite diario de videos se ha alcanzado.\n' +
                    'Intenta de nuevo mañana.';
            }
            else if (error.message.includes('timeout')) {
                errorMessage += '⏱️ El video tardó demasiado\n\n' +
                    'El servidor está muy ocupado.\n' +
                    'Intenta con un texto más corto.';
            }
            else if (error.message.includes('failed')) {
                errorMessage += '❌ Falló la generación\n\n' +
                    'El servidor de HeyGen reportó un error.\n' +
                    'Por favor intenta de nuevo.';
            }
            else {
                errorMessage += `💡 Error: ${error.message || 'Desconocido'}`;
            }
            await sock.sendMessage(chatId, { text: errorMessage });
        }
    }
};

async function createVideo(text) {
    try {
        const response = await axios.post('https://api.heygen.com/v2/video/generate', {
            video_inputs: [
                {
                    character: {
                        type: 'avatar',
                        avatar_id: DEFAULT_AVATAR,
                        avatar_style: 'normal'
                    },
                    voice: {
                        type: 'text',
                        input_text: text,
                        voice_id: DEFAULT_VOICE,
                        speed: 1.0
                    },
                    background: {
                        type: 'color',
                        value: '#ffffff'
                    }
                }
            ],
            dimension: {
                width: 1280,
                height: 720
            },
            test: false 
        }, {
            headers: {
                'X-Api-Key': HEYGEN_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (response.data.error) {
            throw new Error(response.data.error.message || 'Error en la API de HeyGen');
        }
        return response.data.data.video_id;
    }
    catch (error) {
        console.error('Error al crear video:', error.response?.data || error.message);
        throw new Error('No se pudo iniciar la generación del video');
    }
}

async function waitForVideo(videoId, sock, chatId) {
    const maxAttempts = 40; 
    let attempts = 0;
    let lastStatus = '';
    while (attempts < maxAttempts) {
        try {
            const response = await axios.get(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
                headers: {
                    'X-Api-Key': HEYGEN_API_KEY
                }
            });
            const status = response.data.data.status;
            const error = response.data.data.error;
            if (status !== lastStatus) {
                lastStatus = status;
                let statusText = '';
                if (status === 'pending')
                    statusText = '⏳ En cola...';
                else if (status === 'processing')
                    statusText = '🎬 Generando video...';
                else if (status === 'completed')
                    statusText = '✅ ¡Video listo!';
                else if (status === 'failed')
                    statusText = '❌ Falló';
                await sock.sendMessage(chatId, {
                    text: `《✧》 Estado: ${statusText}\n\nIntento ${attempts + 1}/${maxAttempts}`
                });
            }
            if (status === 'completed') {
                const videoUrl = response.data.data.video_url;
                if (!videoUrl) {
                    throw new Error('No se obtuvo la URL del video');
                }
                return videoUrl;
            }

            if (status === 'failed') {
                throw new Error(error?.message || 'La generación del video falló');
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        } catch (error) {
            console.error('Error al verificar estado:', error.message);
            throw error;
        }
    }
    throw new Error('timeout: El video tardó demasiado en generarse');
}

async function downloadVideo(videoUrl) {
    try {
        const response = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 60000 
        });
        return Buffer.from(response.data);
    } catch (error) { console.error('Error al descargar video:', error.message);
        throw new Error('No se pudo descargar el video generado');
    }
}
export default heygenCommand;