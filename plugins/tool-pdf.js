import { PDFDocument } from 'pdf-lib'
import pkg from '@soblend/baileys';
const { downloadContentFromMessage } = pkg;
if (!global.pdfSessions) {
    global.pdfSessions = new Map()
}
const SESSION_TIMEOUT = 300000
async function downloadImage(msg) {
    try {
        const messageType = Object.keys(msg.message || {})[0]
        if (messageType !== 'imageMessage')
            return null
        const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image')
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk)
        } return Buffer.concat(chunks)
    }
    catch (error) {
        console.error('Error descargando imagen:', error)
        return null;
    }
}
function extractImageNumber(caption) {
    if (!caption)
        return null;
    const match = caption.match(/^(\d+)$/);
    return match ? parseInt(match[1]) : null;
}
async function createPdfFromImages(images) {
    const pdfDoc = await PDFDocument.create()
    for (const imageBuffer of images) {
        let image
        try {
            image = await pdfDoc.embedJpg(imageBuffer)
        } catch {
            try {
                image = await pdfDoc.embedPng(imageBuffer)
            }
            catch {
                continue
            }
        }
        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
    }
    return Buffer.from(await pdfDoc.save())
}
async function handleIncomingImage(sock, msg) {
    const pdfSessions = global.pdfSessions
    const chatId = msg.key.remoteJid || msg.chat
    const sessionKey = `${chatId}_${msg.sender}`
    const session = pdfSessions.get(sessionKey)
    if (!session)
        return
    const quotedMsg = msg.quoted
    if (!quotedMsg || quotedMsg.key.id !== session.messageKey.id)
        return
    const messageType = Object.keys(msg.message || {})[0]
    if (messageType !== 'imageMessage') {
        await sock.sendMessage(chatId, {
            text: '《✧》 Por favor, envía solo imágenes.'
        });
        return
    }
    const caption = msg.message.imageMessage?.caption
    const imageNumber = extractImageNumber(caption)
    if (imageNumber === null || imageNumber < 1 || imageNumber > 10) {
        await sock.sendMessage(chatId, {
            text: '《✧》 Por favor, enumera las imágenes del 1 al 10.'
        })
        return
    }
    if (session.images.some(img => img.number === imageNumber)) {
        await sock.sendMessage(chatId, {
            text: `《✧》 Ya recibí la imagen número ${imageNumber}.`
        })
        return
    }
    const imageBuffer = await downloadImage(msg)
    if (!imageBuffer) {
        await sock.sendMessage(chatId, {
            text: '《✧》 Error al descargar la imagen.'
        });
        return
    }
    session.images.push({ number: imageNumber, buffer: imageBuffer })
    await sock.sendMessage(chatId, {
        text: `《✧》 Imagen ${imageNumber}/10 recibida. ${10 - session.images.length} restantes.`
    })
    if (session.images.length === 10) {
        await sock.sendMessage(chatId, {
            text: '《✧》 Procesando PDF...'
        });
        session.images.sort((a, b) => a.number - b.number)
        const orderedBuffers = session.images.map(img => img.buffer)
        try {
            const pdfBuffer = await createPdfFromImages(orderedBuffers)
            await sock.sendMessage(chatId, {
                document: pdfBuffer,
                fileName: `documento_${Date.now()}.pdf`,
                mimetype: 'application/pdf',
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363421377964290@newsletter",
                        newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                        serverMessageId: 1,
                    }
                }
            });
            pdfSessions.delete(sessionKey);
        }
        catch (error) {
            console.error('Error creando PDF:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al crear el PDF.'
            });
        }
    }
}
const pdfCommand = {
    name: 'pdf',
    aliases: ['createpdf', 'topdf'],
    category: 'tools',
    description: 'Crea un PDF a partir de imágenes numeradas del 1 al 10.',
    usage: '#pdf',
    async execute(sock, msg, args) {
        const pdfSessions = global.pdfSessions
        const chatId = msg.key.remoteJid || msg.chat
        const sessionKey = `${chatId}_${msg.sender}`
        const initialMessage = await sock.sendMessage(chatId, {
            text: '《✧》 Envíame las imágenes para crear el PDF, recuerda enviar las imágenes respondiendo a este mensaje, y ponle número de 1 hasta 10 a cada imagen.'
        })
        pdfSessions.set(sessionKey, {
            chatId: chatId,
            userId: msg.sender,
            images: [],
            messageKey: initialMessage.key,
            timestamp: Date.now()
        })
        setTimeout(() => {
            if (pdfSessions.has(sessionKey)) {
                pdfSessions.delete(sessionKey);
                sock.sendMessage(chatId, {
                    text: '《✧》 Sesión de PDF expirada por inactividad.'
                });
            }
        }, SESSION_TIMEOUT)
    },
    async onMessage(sock, msg) {
        await handleIncomingImage(sock, msg)
    }
}

export default pdfCommand