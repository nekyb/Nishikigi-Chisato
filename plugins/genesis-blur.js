import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
const logger = pino({ level: 'silent' });
let faceDetector = null;

async function initializeFaceDetector() {
    if (faceDetector)
        return faceDetector;
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
    faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'CPU'
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5
    });
    return faceDetector;
}
const blurCommand = {
    name: 'blur',
    aliases: ['blurface', 'censor', 'privacy'],
    category: 'tools',
    description: 'Difumina/censura rostros en imágenes para proteger la privacidad',
    usage: '#blur [enviar o responder a una imagen]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            let imageMessage = msg.message?.imageMessage;
            if (!imageMessage && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                imageMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }
            if (!imageMessage) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Blur Faces - Protección de Privacidad* 《✧》\n\n` +
                        `Difumina automáticamente todos los rostros en una imagen.\n\n` +
                        `*Uso:*\n` +
                        `✿ Envía una imagen con el comando #blur\n` +
                        `✿ Responde a una imagen con #blur\n\n` +
                        `*Características:*\n` +
                        `✓ Detecta múltiples rostros\n` +
                        `✓ Difuminado suave y natural\n` +
                        `✓ Protege la identidad\n` +
                        `✓ Mantiene la calidad de la imagen\n\n` +
                        `💡 *Ideal para:*\n` +
                        `- Proteger la privacidad de personas\n` +
                        `- Compartir fotos grupales de forma segura\n` +
                        `- Publicar contenido con menores\n` +
                        `- Cumplir normativas de privacidad`
                });
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 🎭 Procesando imagen...\n\n⏳ Detectando y difuminando rostros...'
            });
            let imageBuffer;
            try {
                const messageToDownload = msg.message?.imageMessage ? msg :
                    {
                        message: {
                            imageMessage: msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
                        },
                        key: msg.message.extendedTextMessage.contextInfo.stanzaId ? {
                            remoteJid: msg.key.remoteJid,
                            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: msg.message.extendedTextMessage.contextInfo.participant
                        } : msg.key
                    };
                imageBuffer = await downloadMediaMessage(messageToDownload, 'buffer', {}, {
                    logger,
                    reuploadRequest: sock.updateMediaMessage
                });
            }
            catch (downloadError) {
                console.error('Error al descargar imagen:', downloadError);
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ Error al descargar la imagen\n\n' +
                        '💡 *Tip:* Intenta enviar la imagen nuevamente.'
                });
            }

            const result = await blurFacesInImage(imageBuffer);
            if (!result.success) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 ${result.message}\n\n` +
                        `${result.facesDetected !== undefined ? `👤 Rostros detectados: ${result.facesDetected}` : ''}`
                });
            } await sock.sendMessage(chatId, {
                image: result.blurredImage,
                caption: `《✧》 *Imagen Procesada* 《✧》\n\n` +
                    `✅ Rostros difuminados: ${result.facesDetected}\n` +
                    `🎭 Privacidad protegida\n` +
                    `⚡ Procesado con MediaPipe AI`
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando blur:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Error al procesar la imagen\n\n' +
                    `💡 Error: ${error.message || 'Desconocido'}\n\n` +
                    'Intenta con una imagen más pequeña o diferente.'
            });
        }
    }
};

async function blurFacesInImage(imageBuffer) {
    try {
        const detector = await initializeFaceDetector();
        const image = await loadImage(imageBuffer);
        const width = image.width;
        const height = image.height;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const detections = detector.detect(imageData);
        if (!detections.detections || detections.detections.length === 0) {
            return {
                success: false,
                message: '😔 No se detectaron rostros en la imagen',
                facesDetected: 0
            };
        }
        console.log(`Detectados ${detections.detections.length} rostros`);
        for (const detection of detections.detections) {
            const bbox = detection.boundingBox;
            if (!bbox)
                continue;
            const margin = 20;
            const x = Math.max(0, bbox.originX - margin);
            const y = Math.max(0, bbox.originY - margin);
            const w = Math.min(width - x, bbox.width + margin * 2);
            const h = Math.min(height - y, bbox.height + margin * 2);
            applyBlurToRegion(ctx, x, y, w, h, 30);
        }

        const blurredBuffer = canvas.toBuffer('image/jpeg', 90);
        return {
            success: true,
            blurredImage: blurredBuffer,
            facesDetected: detections.detections.length
        };
    }
    catch (error) {
        console.error('Error al difuminar rostros:', error);
        return {
            success: false,
            message: `❌ Error en el procesamiento: ${error.message}`
        };
    }
}

function applyBlurToRegion(ctx, x, y, width, height, blurAmount) {
    const imageData = ctx.getImageData(x, y, width, height);
    const blurred = stackBlur(imageData, blurAmount);
    ctx.putImageData(blurred, x, y);
}

function stackBlur(imageData, radius) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const mulSum = [
        512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
        454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512
    ];
    const shgSum = [
        9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
        17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19
    ];
    radius = Math.floor(radius);
    if (radius < 1)
        return imageData;
    if (radius > 31)
        radius = 31;
    const mul = mulSum[radius - 1];
    const shg = shgSum[radius - 1];
    for (let y = 0; y < height; y++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
        let rInSum = 0, gInSum = 0, bInSum = 0, aInSum = 0;
        let rOutSum = 0, gOutSum = 0, bOutSum = 0, aOutSum = 0;
        const yi = y * width;
        for (let i = -radius; i <= radius; i++) {
            const x = Math.min(width - 1, Math.max(0, i));
            const idx = (yi + x) * 4;
            const rbs = radius + 1 - Math.abs(i);
            rSum += pixels[idx] * rbs;
            gSum += pixels[idx + 1] * rbs;
            bSum += pixels[idx + 2] * rbs;
            aSum += pixels[idx + 3] * rbs;
            if (i > 0) {
                rInSum += pixels[idx];
                gInSum += pixels[idx + 1];
                bInSum += pixels[idx + 2];
                aInSum += pixels[idx + 3];
            }
            else {
                rOutSum += pixels[idx];
                gOutSum += pixels[idx + 1];
                bOutSum += pixels[idx + 2];
                aOutSum += pixels[idx + 3];
            }
        }
        for (let x = 0; x < width; x++) {
            const idx = (yi + x) * 4;
            pixels[idx] = (rSum * mul) >> shg;
            pixels[idx + 1] = (gSum * mul) >> shg;
            pixels[idx + 2] = (bSum * mul) >> shg;
            pixels[idx + 3] = (aSum * mul) >> shg;
            rSum -= rOutSum;
            gSum -= gOutSum;
            bSum -= bOutSum;
            aSum -= aOutSum;
            const nextX = x + radius + 1;
            if (nextX < width) {
                const nextIdx = (yi + nextX) * 4;
                rInSum += pixels[nextIdx];
                gInSum += pixels[nextIdx + 1];
                bInSum += pixels[nextIdx + 2];
                aInSum += pixels[nextIdx + 3];
            }
            rSum += rInSum;
            gSum += gInSum;
            bSum += bInSum;
            aSum += aInSum;
            const prevX = x - radius;
            if (prevX >= 0) {
                const prevIdx = (yi + prevX) * 4;
                rOutSum -= pixels[prevIdx];
                gOutSum -= pixels[prevIdx + 1];
                bOutSum -= pixels[prevIdx + 2];
                aOutSum -= pixels[prevIdx + 3];
            }
            rInSum -= pixels[idx];
            gInSum -= pixels[idx + 1];
            bInSum -= pixels[idx + 2];
            aInSum -= pixels[idx + 3];
            rOutSum += pixels[idx];
            gOutSum += pixels[idx + 1];
            bOutSum += pixels[idx + 2];
            aOutSum += pixels[idx + 3];
        }
    }
    for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
        let rInSum = 0, gInSum = 0, bInSum = 0, aInSum = 0;
        let rOutSum = 0, gOutSum = 0, bOutSum = 0, aOutSum = 0;
        for (let i = -radius; i <= radius; i++) {
            const y = Math.min(height - 1, Math.max(0, i));
            const idx = (y * width + x) * 4;
            const rbs = radius + 1 - Math.abs(i);
            rSum += pixels[idx] * rbs;
            gSum += pixels[idx + 1] * rbs;
            bSum += pixels[idx + 2] * rbs;
            aSum += pixels[idx + 3] * rbs;
            if (i > 0) {
                rInSum += pixels[idx];
                gInSum += pixels[idx + 1];
                bInSum += pixels[idx + 2];
                aInSum += pixels[idx + 3];
            }
            else {
                rOutSum += pixels[idx];
                gOutSum += pixels[idx + 1];
                bOutSum += pixels[idx + 2];
                aOutSum += pixels[idx + 3];
            }
        }
        for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            pixels[idx] = (rSum * mul) >> shg;
            pixels[idx + 1] = (gSum * mul) >> shg;
            pixels[idx + 2] = (bSum * mul) >> shg;
            pixels[idx + 3] = (aSum * mul) >> shg;
            rSum -= rOutSum;
            gSum -= gOutSum;
            bSum -= bOutSum;
            aSum -= aOutSum;
            const nextY = y + radius + 1;
            if (nextY < height) {
                const nextIdx = (nextY * width + x) * 4;
                rInSum += pixels[nextIdx];
                gInSum += pixels[nextIdx + 1];
                bInSum += pixels[nextIdx + 2];
                aInSum += pixels[nextIdx + 3];
            }
            rSum += rInSum;
            gSum += gInSum;
            bSum += bInSum;
            aSum += aInSum;
            const prevY = y - radius;
            if (prevY >= 0) {
                const prevIdx = (prevY * width + x) * 4;
                rOutSum -= pixels[prevIdx];
                gOutSum -= pixels[prevIdx + 1];
                bOutSum -= pixels[prevIdx + 2];
                aOutSum -= pixels[prevIdx + 3];
            }
            rInSum -= pixels[idx];
            gInSum -= pixels[idx + 1];
            bInSum -= pixels[idx + 2];
            aInSum -= pixels[idx + 3];
            rOutSum += pixels[idx];
            gOutSum += pixels[idx + 1];
            bOutSum += pixels[idx + 2];
            aOutSum += pixels[idx + 3];
        }
    }
    return imageData;
}
export default blurCommand;