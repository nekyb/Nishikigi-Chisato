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
                console.log(`Rate limit alcanzado, esperando ${waitTime}ms...`)
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
                const userNumber = participant.split('@')[0]
                const userName = await this.getUserName(sock, participant)
                
                try {
                    let profilePicUrl = 'https://i.imgur.com/whjlJSf.jpg'
                    try {
                        const picUrl = await sock.profilePictureUrl(participant, 'image')
                        if (picUrl) profilePicUrl = picUrl
                    } catch {
                        profilePicUrl = 'https://i.imgur.com/whjlJSf.jpg'
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
                            caption: `✦ ¡Bienvenid@ @${userNumber}!\n\nEscribe #help para comenzar`,
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
                    console.error('Error enviando bienvenida:', error)
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
            console.error('Error en welcome event:', error)
        }
    },
    
    async createWelcomeImage(userName, userNumber, groupName, profilePicUrl) {
        try {
            const canvas = createCanvas(1200, 400)
            const ctx = canvas.getContext('2d')
            
            // Gradiente moderno (estilo cyberpunk/neon)
            const gradient = ctx.createLinearGradient(0, 0, 1200, 400)
            gradient.addColorStop(0, '#0f0c29')
            gradient.addColorStop(0.5, '#302b63')
            gradient.addColorStop(1, '#24243e')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, 1200, 400)
            
            // Efecto de cuadrícula futurista
            ctx.strokeStyle = 'rgba(100, 255, 218, 0.1)'
            ctx.lineWidth = 1
            for (let i = 0; i < 1200; i += 40) {
                ctx.beginPath()
                ctx.moveTo(i, 0)
                ctx.lineTo(i, 400)
                ctx.stroke()
            }
            for (let i = 0; i < 400; i += 40) {
                ctx.beginPath()
                ctx.moveTo(0, i)
                ctx.lineTo(1200, i)
                ctx.stroke()
            }
            
            // Círculos brillantes flotantes (estilo neon)
            const neonColors = ['#64ffda', '#ff6b9d', '#c471f5', '#00d4ff']
            for (let i = 0; i < 25; i++) {
                const x = Math.random() * 1200
                const y = Math.random() * 400
                const radius = Math.random() * 4 + 2
                const color = neonColors[Math.floor(Math.random() * neonColors.length)]
                
                ctx.shadowBlur = 20
                ctx.shadowColor = color
                ctx.fillStyle = color + '40'
                ctx.beginPath()
                ctx.arc(x, y, radius, 0, Math.PI * 2)
                ctx.fill()
            }
            ctx.shadowBlur = 0
            
            // Avatar con efecto glassmorphism
            try {
                const imageBuffer = await downloadImageWithRetry(profilePicUrl)
                const avatarImage = await loadImage(imageBuffer)
                
                // Círculo de fondo con blur
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
                ctx.beginPath()
                ctx.arc(180, 200, 100, 0, Math.PI * 2)
                ctx.fill()
                
                // Avatar circular
                ctx.save()
                ctx.beginPath()
                ctx.arc(180, 200, 90, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(avatarImage, 90, 110, 180, 180)
                ctx.restore()
                
                // Borde neon triple
                ctx.strokeStyle = '#64ffda'
                ctx.lineWidth = 3
                ctx.shadowBlur = 15
                ctx.shadowColor = '#64ffda'
                ctx.beginPath()
                ctx.arc(180, 200, 90, 0, Math.PI * 2)
                ctx.stroke()
                
                ctx.strokeStyle = '#ff6b9d'
                ctx.lineWidth = 2
                ctx.shadowColor = '#ff6b9d'
                ctx.beginPath()
                ctx.arc(180, 200, 100, 0, Math.PI * 2)
                ctx.stroke()
                
                ctx.shadowBlur = 0
            } catch (error) {
                console.error('Error cargando avatar:', error)
                // Avatar fallback con gradiente
                const avatarGradient = ctx.createRadialGradient(180, 200, 30, 180, 200, 90)
                avatarGradient.addColorStop(0, '#64ffda')
                avatarGradient.addColorStop(1, '#302b63')
                ctx.fillStyle = avatarGradient
                ctx.beginPath()
                ctx.arc(180, 200, 90, 0, Math.PI * 2)
                ctx.fill()
            }
            
            // Línea divisoria neon
            const lineGradient = ctx.createLinearGradient(330, 200, 1150, 200)
            lineGradient.addColorStop(0, 'rgba(100, 255, 218, 0)')
            lineGradient.addColorStop(0.5, 'rgba(100, 255, 218, 0.8)')
            lineGradient.addColorStop(1, 'rgba(100, 255, 218, 0)')
            ctx.strokeStyle = lineGradient
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(330, 200)
            ctx.lineTo(1150, 200)
            ctx.stroke()
            
            // Texto "WELCOME" minimalista
            ctx.fillStyle = '#64ffda'
            ctx.font = 'bold 35px "Inter", "SF Pro Display", sans-serif'
            ctx.textAlign = 'left'
            ctx.letterSpacing = '0.1em'
            ctx.fillText('WELCOME', 330, 120)
            
            // Nombre del usuario - fuente grande
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 48px "Inter", "SF Pro Display", sans-serif'
            const maxNameWidth = 800
            let displayName = userName
            let nameWidth = ctx.measureText(displayName).width
            
            while (nameWidth > maxNameWidth && displayName.length > 0) {
                displayName = displayName.slice(0, -1)
                nameWidth = ctx.measureText(displayName + '...').width
            }
            if (displayName !== userName) {
                displayName += '...'
            }
            ctx.fillText(displayName, 330, 170)
            
            // Número con estilo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.font = '24px "JetBrains Mono", "Courier New", monospace'
            ctx.fillText(`+${userNumber}`, 330, 240)
            
            // Badge "NEW MEMBER"
            ctx.fillStyle = 'rgba(100, 255, 218, 0.2)'
            ctx.fillRect(330, 260, 150, 30)
            ctx.fillStyle = '#64ffda'
            ctx.font = 'bold 14px "Inter", sans-serif'
            ctx.fillText('NEW MEMBER', 345, 280)
            
            // Marca de agua minimalista
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.font = '14px "Inter", sans-serif'
            ctx.textAlign = 'right'
            ctx.fillText('DeltaByte', 1160, 370)
            
            return canvas.toBuffer('image/png')
        } catch (error) {
            console.error('Error creando imagen de bienvenida:', error)
            return null
        }
    },
    
    createWelcomeMessage(userName, userNumber) {
        return `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ✦
━━━━━━━━━━━━━━━━━━━━━

👤 @${userNumber}
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
                const userNumber = participant.split('@')[0]
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
            console.error('Error en goodbye message:', error)
        }
    }
}

export default welcomeEvent