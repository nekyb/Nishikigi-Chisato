
import { getGroupSettings } from '../database/users.js'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import axios from 'axios'

const imageCache = new Map()
const lastRequestTime = { imgur: 0 }
const MIN_REQUEST_INTERVAL = 1000

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function downloadImageWithRetry(url, retries = 3) {
    if (imageCache.has(url)) {
        return imageCache.get(url)
    }
    for (let i = 0; i < retries; i++) {
        try {
            const now = Date.now()
            const timeSinceLastRequest = now - lastRequestTime.imgur
            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
                await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest)
            }
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 10000
            })
            lastRequestTime.imgur = Date.now()
            const buffer = Buffer.from(response.data)
            imageCache.set(url, buffer)
            return buffer
        } catch (error) {
            if (error.response?.status === 429) {
                const waitTime = Math.pow(2, i) * 2000
                await sleep(waitTime)
                continue
            }
            if (i === retries - 1) throw error
            await sleep(1000 * (i + 1))
        }
    }
    throw new Error('Máximo de reintentos alcanzado')
}

export const welcomeEvent = {
    name: 'welcome',
    enabled: true,
    
    async handleNewParticipants(sock, update) {
        const { id: groupId, participants, action } = update
        try {
            if (action !== 'add') return
            
            const settings = await getGroupSettings(groupId)
            if (!settings || !settings.welcome) return
            
            const groupMetadata = await sock.groupMetadata(groupId)
            const groupName = groupMetadata.subject
            
            for (const participant of participants) {
                // Limpiar el número correctamente
                const cleanNumber = participant.replace(/@(s\.whatsapp\.net|lid|c\.us)$/i, '');
                const userNumber = cleanNumber;
                const userName = await this.getUserName(sock, participant)
                
                try {
                    let profilePicUrl = 'https://i.pinimg.com/474x/a8/09/0c/a8090cb1191598be42ea3470df628b93.jpg'
                    try {
                        const picUrl = await sock.profilePictureUrl(participant, 'image')
                        if (picUrl) profilePicUrl = picUrl
                    } catch {
                        profilePicUrl = 'https://i.pinimg.com/474x/a8/09/0c/a8090cb1191598be42ea3470df628b93.jpg'
                    }
                    
                    const welcomeImage = await this.createWelcomeImage(
                        userName, 
                        userNumber, 
                        groupName, 
                        profilePicUrl
                    )
                    
                    if (welcomeImage) {
                        await sock.sendMessage(groupId, {
                            image: welcomeImage,
                            mimetype: 'image/png',
                            caption: `✦ ¡Bienvenid@ @${userNumber}!\n\nEscribe #help para comenzar`,
                            mentions: [participant],
                            jpegThumbnail: null,
                            contextInfo: {
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: "120363421377964290@newsletter",
                                    newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                                    serverMessageId: 1
                                }
                            }
                        })
                    } else {
                        const welcomeMessage = this.createWelcomeMessage(userName, userNumber)
                        await sock.sendMessage(groupId, {
                            text: welcomeMessage,
                            mentions: [participant],
                            contextInfo: {
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: "120363421377964290@newsletter",
                                    newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                                    serverMessageId: 1
                                }
                            }
                        })
                    }
                } catch (error) {
                    const welcomeMessage = this.createWelcomeMessage(userName, userNumber)
                    await sock.sendMessage(groupId, {
                        text: welcomeMessage,
                        mentions: [participant],
                        contextInfo: {
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363421377964290@newsletter",
                                newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                                serverMessageId: 1
                            }
                        }
                    })
                }
                
                if (participants.length > 1) {
                    await sleep(2000)
                }
            }
        } catch (error) {
            // Error silencioso
        }
    },
    
    async createWelcomeImage(userName, userNumber, groupName, profilePicUrl) {
        try {
            // Dimensiones originales de la imagen: 413px ancho x 735px alto
            const width = 413
            const height = 735
            const canvas = createCanvas(width, height)
            const ctx = canvas.getContext('2d')
            
            // Cargar imagen de fondo
            const backgroundUrl = 'https://i.pinimg.com/736x/6e/5d/e7/6e5de7ce1261df88e0d69cc4d8c58119.jpg'
            const backgroundBuffer = await downloadImageWithRetry(backgroundUrl)
            const backgroundImage = await loadImage(backgroundBuffer)
            
            // Dibujar fondo sin escalar (mantener dimensiones originales)
            ctx.drawImage(backgroundImage, 0, 0, width, height)
            
            // Overlay oscuro semi-transparente para mejorar legibilidad
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
            ctx.fillRect(0, 0, 413, 735)
            
            // Cargar y dibujar foto de perfil circular
            try {
                const avatarBuffer = await downloadImageWithRetry(profilePicUrl)
                const avatarImage = await loadImage(avatarBuffer)
                
                // Posición: centro horizontalmente, un poco arriba verticalmente
                const avatarSize = 140
                const avatarX = 206.5 // Centro horizontal
                const avatarY = 200 // Un poco arriba
                
                // Círculo de fondo blanco con sombra
                ctx.shadowBlur = 20
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
                ctx.fillStyle = '#ffffff'
                ctx.beginPath()
                ctx.arc(avatarX, avatarY, avatarSize / 2 + 6, 0, Math.PI * 2)
                ctx.fill()
                ctx.shadowBlur = 0
                
                // Recortar avatar en círculo
                ctx.save()
                ctx.beginPath()
                ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(avatarImage, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)
                ctx.restore()
                
                // Borde circular decorativo
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
                ctx.stroke()
                
            } catch (error) {
                // Usar imagen por defecto
                const defaultAvatarBuffer = await downloadImageWithRetry('https://i.pinimg.com/474x/a8/09/0c/a8090cb1191598be42ea3470df628b93.jpg')
                const defaultAvatar = await loadImage(defaultAvatarBuffer)
                
                const avatarSize = 140
                const avatarX = 206.5
                const avatarY = 200
                
                ctx.shadowBlur = 20
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
                ctx.fillStyle = '#ffffff'
                ctx.beginPath()
                ctx.arc(avatarX, avatarY, avatarSize / 2 + 6, 0, Math.PI * 2)
                ctx.fill()
                ctx.shadowBlur = 0
                
                ctx.save()
                ctx.beginPath()
                ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(defaultAvatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)
                ctx.restore()
                
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
                ctx.stroke()
            }
            
            // Limpiar número de caracteres extraños
            const displayNumber = userNumber.replace(/\+/g, '');
            
            // Dibujar número debajo de la foto (Product Sans simulado con Arial)
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 32px Arial, sans-serif'
            ctx.textAlign = 'center'
            ctx.shadowBlur = 8
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
            ctx.fillText(`+${displayNumber}`, 206.5, 330)
            ctx.shadowBlur = 0
            
            // Texto de bienvenida más abajo
            ctx.fillStyle = '#ffffff'
            ctx.font = '28px Arial, sans-serif'
            ctx.textAlign = 'center'
            ctx.shadowBlur = 8
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
            ctx.fillText('Bienvenido/a,', 206.5, 400)
            ctx.fillText('disfruta tu estadía', 206.5, 440)
            ctx.shadowBlur = 0
            
            // Marca de agua DeltaByte en la parte inferior
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.font = '16px Arial, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('DeltaByte', 206.5, 700)
            
            // Retornar buffer PNG de alta calidad
            return canvas.toBuffer('image/png', { quality: 1.0 })
        } catch (error) {
            return null
        }
    },
    
    createWelcomeMessage(userName, userNumber) {
        const cleanNumber = userNumber.replace(/\+/g, '');
        return `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ✦
━━━━━━━━━━━━━━━━━━━━━

👤 @${cleanNumber}
📝 ${userName}

━━━━━━━━━━━━━━━━━━━━━

¡Disfruta tu estadía! 
Escribe #help para comenzar

━━━━━━━━━━━━━━━━━━━━━
𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺 𝘋𝘦𝘭𝘵𝘢𝘉𝘺𝘵𝘦`
    },
    
    async getUserName(sock, userId) {
        try {
            const contact = await sock.onWhatsApp(userId)
            if (contact && contact[0]?.notify) {
                return contact[0].notify
            }
            return userId.split('@')[0]
        } catch (error) {
            return userId.split('@')[0]
        }
    },
    
    async handleParticipantLeft(sock, update) {
        const { id: groupId, participants, action } = update
        try {
            if (action !== 'remove') return
            
            const settings = await getGroupSettings(groupId)
            if (!settings || !settings.welcome) return
            
            for (const participant of participants) {
                const cleanNumber = participant.replace(/@(s\.whatsapp\.net|lid|c\.us)$/i, '');
                const userNumber = cleanNumber;
                const userName = await this.getUserName(sock, participant)
                
                const goodbyeMessage = `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗚𝗢𝗢𝗗𝗕𝗬𝗘 ✦
━━━━━━━━━━━━━━━━━━━━━

@${userNumber} (${userName})
ha salido del grupo

¡Hasta pronto! 👋

━━━━━━━━━━━━━━━━━━━━━`
                
                await sock.sendMessage(groupId, {
                    text: goodbyeMessage,
                    mentions: [participant],
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363421377964290@newsletter",
                            newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                            serverMessageId: 1
                        }
                    }
                })
            }
        } catch (error) {
            // Error silencioso
        }
    }
}

export default welcomeEvent
