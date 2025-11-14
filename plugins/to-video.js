import { webp2mp4 } from '../lib/webp2mp4.js'
import { ffmpeg } from '../lib/converter.js'
import pkg from '@soblend/baileys';
const { downloadContentFromMessage } = pkg;

async function downloadMedia(msg) {
    const messageType = Object.keys(msg.message)[0]
    const stream = await downloadContentFromMessage(msg.message[messageType], messageType.replace('Message', ''))
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])}
    return buffer}

const toVideoCommand = {
    name: 'tovideo',
    aliases: ['tomp4', 'mp4', 'togif'],
    category: 'transformador',
    description: 'Convierte stickers animados a video',
    usage: '#tovideo (responde a un sticker)',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            return await sock.sendMessage(chatId, {
                text: '🛑 Responde a un sticker que desees convertir en video con el comando #tovideo'
            }, { quoted: msg })}
        
        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage
        if (!quotedMsg.stickerMessage) {
            return await sock.sendMessage(chatId, {
                text: '🛑 Responde a un sticker que desees convertir en video con el comando #tovideo'
            }, { quoted: msg })}
        
        try {await sock.sendMessage(chatId, {text: '⏳ Convirtiendo sticker a video, espera un momento...'}, { quoted: msg })
            const quotedFullMsg = {
                key: {
                    remoteJid: chatId,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant},
                message: quotedMsg}
            const media = await downloadMedia(quotedFullMsg)
            if (!media || media.length === 0) {throw new Error('No se pudo descargar el sticker')}
            let videoBuffer
            if (quotedMsg.stickerMessage.mimetype === 'image/webp' || quotedMsg.stickerMessage.isAnimated) {videoBuffer = await webp2mp4(media)
            } else {videoBuffer = await ffmpeg(media, [
                    '-filter_complex', 'color',
                    '-pix_fmt', 'yuv420p',
                    '-crf', '51',
                    '-c:a', 'copy',
                    '-shortest',
                ], 'webp', 'mp4')}
            if (!videoBuffer || videoBuffer.length === 0) {throw new Error('Error al convertir el sticker')}
            await sock.sendMessage(chatId, {
                video: videoBuffer,
                caption: '🌳 *Tu Video*',
                gifPlayback: true
            }, { quoted: msg })
        } catch (error) {
            console.log('Error en tovideo:', error)
            await sock.sendMessage(chatId, {
                text: `❌ Error al convertir el sticker a video.\n\n_Asegúrate de responder a un sticker animado_\n\nError: ${error.message}`
            }, { quoted: msg })}}}
export default toVideoCommand