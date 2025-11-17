const nsfwjs = require('nsfwjs')
const tf = require('@tensorflow/tfjs')
const { getGroupSettings, updateGroupWarnings, getGroupWarnings } = require('../database/users.js')
const { downloadMediaMessage } = require('@neoxr/baileys')
const sharp = require('sharp')

tf.setBackend('cpu')

const antinsfwEvent = {
    name: 'antinsfw',
    enabled: true,
    model: null,
    config: {
        maxWarnings: 2,
        deleteDelay: 500,
        kickDelay: 2000,
        threshold: 0.6,
        strictMode: false,
        processTimeout: 30000,
    },

    categories: {
        Porn: { threshold: 0.6, strict: 0.4, severity: 'high' },
        Hentai: { threshold: 0.7, strict: 0.5, severity: 'high' },
        Sexy: { threshold: 0.8, strict: 0.6, severity: 'medium' },
        Neutral: { threshold: 1.0, strict: 1.0, severity: 'none' },
        Drawing: { threshold: 1.0, strict: 1.0, severity: 'none' },
    },

    async initialize() {
        if (this.model) return this.model
        try {
            this.model = await nsfwjs.load('MobileNetV2Mid')
            console.log('✅ Modelo NSFW cargado exitosamente')
            return this.model
        } catch (error) {
            console.error('❌ Error cargando modelo NSFW:', error)
            this.enabled = false
            return null
        }
    },

    async handleMessage(sock, msg, isAdmin, isBotAdmin) {
        
        try {
            if (!msg.key.remoteJid?.endsWith('@g.us')) {
                return false
            }
            
            // SI EL BOT ES ADMIN: Los admins están exentos
            // SI EL BOT NO ES ADMIN: Analizar a todos (incluso admins) para poder alertar
            if (isAdmin && isBotAdmin) {
                return false
            }
            
            if (!this.enabled) {
                console.log('❌ Sistema deshabilitado')
                return false
            }
            
            const groupJid = msg.key.remoteJid
            const settings = await getGroupSettings(groupJid)
            
            if (!settings?.antinsfw) {
                console.log('❌ Anti-NSFW no activado en este grupo')
                return false
            }
            
            const mediaType = this.getMediaType(msg)
            
            if (!mediaType) {
                return false
            }
            
            if (!this.model) {
                await this.initialize()
                if (!this.model) {
                    console.error('❌ No se pudo cargar el modelo')
                    return false
                }
            }

            const analysis = await this.analyzeMedia(sock, msg, mediaType)
            
            if (!analysis) {
                console.log('❌ Error en el análisis')
                return false
            }
            
            
            if (analysis.isNSFW) {
                console.log('🚨 ¡CONTENIDO NSFW DETECTADO!')
                
                // Si el bot NO es admin, solo alertar (sin importar si el usuario es admin)
                if (!isBotAdmin) {
                    console.log('⚠️ Bot NO es admin - Alertando a administradores')
                    await this.alertAdminsNoPermission(sock, msg, analysis, isAdmin)
                    return false
                }
                
                // Si el bot ES admin pero el usuario también es admin, solo advertir suavemente
                if (isBotAdmin && isAdmin) {
                    console.log('⚠️ Usuario es admin - Advertencia suave sin castigo')
                    await this.warnAdmin(sock, msg, analysis)
                    return false
                }
                
                // Usuario normal + bot admin = castigo normal
                console.log('⚡ Aplicando castigo a usuario normal...')
                await this.applyPunishment(sock, msg, analysis)
                console.log('✅ Castigo aplicado exitosamente')
                return true
            }
            
            console.log('✅ Contenido seguro')
            return false
            
        } catch (error) {
            console.error('❌ Error crítico en antinsfw:', error)
            return false
        } finally {
        }
    },

    getMediaType(msg) {
        const message = msg.message
        if (message?.imageMessage) return 'image'
        if (message?.videoMessage) return 'video'
        if (message?.stickerMessage) return 'sticker'
        return null
    },

    async analyzeMedia(sock, msg, mediaType) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), this.config.processTimeout)
            )
            const analysisPromise = this._performAnalysis(sock, msg, mediaType)
            const result = await Promise.race([analysisPromise, timeoutPromise])
            return result
        } catch (error) {
            if (error.message === 'Timeout') {
                console.error('⏱️ Timeout analizando media')
            } else {
                console.error('❌ Error analizando media:', error)
            }
            return null
        }
    },

    async _performAnalysis(sock, msg, mediaType) {
        try {
            const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            if (!buffer) {
                console.error('❌ No se pudo descargar la media')
                return null
            }

            let imageBuffer = buffer
            if (mediaType === 'video') {
                imageBuffer = await this.extractVideoFrame(buffer)
                if (!imageBuffer) return null
            }

            const image = sharp(imageBuffer).resize(224, 224, { fit: 'cover' })
            const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
            
            if (info.channels !== 3) {
                console.error('❌ La imagen no tiene 3 canales RGB')
                return null
            }
            
            const tensor = tf.tensor3d(data, [info.height, info.width, info.channels])
            const predictions = await this.model.classify(tensor)
            tensor.dispose()
            
            return this.evaluatePredictions(predictions)
        } catch (error) {
            console.error('❌ Error en análisis:', error)
            return null
        }
    },

    async extractVideoFrame(videoBuffer) {
        try {
            const frame = await sharp(videoBuffer, {
                animated: false,
                page: 0
            })
            .resize(224, 224)
            .toBuffer()
            return frame
        } catch (error) {
            console.error('❌ Error extrayendo frame:', error)
            return null
        }
    },

    evaluatePredictions(predictions) {
        
        const useStrictMode = this.config.strictMode
        let isNSFW = false
        let detectedCategory = null
        let confidence = 0
        let severity = 'none'
        
        for (const prediction of predictions) {
            const category = this.categories[prediction.className]
            if (!category) continue
            
            const threshold = useStrictMode ? category.strict : category.threshold
            
            if (prediction.probability >= threshold && category.severity !== 'none') {
                isNSFW = true
                detectedCategory = prediction.className
                confidence = prediction.probability
                severity = category.severity
                break
            }
        }

        return {
            isNSFW,
            category: detectedCategory,
            confidence: (confidence * 100).toFixed(2),
            severity,
            allPredictions: predictions.map(p => ({
                class: p.className,
                probability: (p.probability * 100).toFixed(2) + '%'
            }))
        }
    },

    async alertAdminsNoPermission(sock, msg, analysis, senderIsAdmin) {
        const groupJid = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        const userNumber = sender.split('@')[0]
        
        try {
            const groupMetadata = await sock.groupMetadata(groupJid)
            const admins = groupMetadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id)
            
            const severityText = analysis.severity === 'high' ? 'MUY GRAVE' : 'GRAVE'
            const categoryText = analysis.category === 'Porn' ? 'contenido explícito' : 
                                 analysis.category === 'Hentai' ? 'contenido inapropiado' : 
                                 'contenido sugestivo'
            
            let alertMsg
            
            if (senderIsAdmin) {
                alertMsg = `Ey admins 🚨

El admin @${userNumber} acaba de enviar ${categoryText} y yo no tengo permisos para eliminarlo.

Detalles de lo que detecté:
✩ Tipo: ${analysis.category}
✩ Confianza: ${analysis.confidence}%
✩ Gravedad: ${severityText}

Normalmente yo no me meto con los admins, pero como no tengo permisos aquí ni siquiera puedo borrar el mensaje. Revísenlo ustedes y decidan qué hacer.

Si me hacen admin del grupo, puedo manejar esto automáticamente (aunque igual dejaría pasar a los admins, solo alertaría en privado) 😅`
            } else {
                alertMsg = `Ey admins, necesito ayuda urgente 🚨

@${userNumber} acaba de enviar ${categoryText} y yo no puedo hacer nada porque no tengo permisos de admin.

Lo que detecté:
✩ Tipo: ${analysis.category}
✩ Confianza: ${analysis.confidence}%
✩ Gravedad: ${severityText}

Por favor revisen el mensaje y tomen acción. Si quieren que yo me encargue automáticamente de estas cosas, solo háganme admin del grupo.

Mientras tanto, les toca manejarlo ustedes 👀`
            }

            const mentions = [sender, ...admins]
            
            await sock.sendMessage(groupJid, {
                text: alertMsg,
                mentions: mentions
            })
            
            console.log(`🔔 Alerta enviada. Admins mencionados: ${admins.length}`)
            
        } catch (error) {
            console.error('❌ Error enviando alerta a admins:', error)
        }
    },

    async warnAdmin(sock, msg, analysis) {
        const groupJid = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        const userNumber = sender.split('@')[0]
        
        const categoryText = analysis.category === 'Porn' ? 'contenido explícito' : 
                           analysis.category === 'Hentai' ? 'contenido inapropiado' : 
                           'contenido sugestivo'
        
        const warnMsg = `Ey @${userNumber}, acabas de enviar ${categoryText}

Normalmente yo saco a la gente por esto, pero como eres admin solo te aviso. Sería bueno que cuides lo que compartes en el grupo aunque tengas permisos 😅

Detección: ${analysis.category} (${analysis.confidence}% confianza)`

        await sock.sendMessage(groupJid, {
            text: warnMsg,
            mentions: [sender]
        })
    },

    async applyPunishment(sock, msg, analysis) {
        const groupJid = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        const userNumber = sender.split('@')[0]
        
        try {
            const warnings = await getGroupWarnings(groupJid, sender)
            const newWarnings = warnings + 1
            
            await this.deleteMessage(sock, msg)
            
            if (analysis.severity === 'high' || newWarnings >= this.config.maxWarnings) {
                await this.kickUser(sock, msg, sender, userNumber, analysis)
            } else {
                await this.warnUser(sock, msg, sender, userNumber, newWarnings, analysis)
            }
            
            await updateGroupWarnings(groupJid, sender, newWarnings)
            
        } catch (error) {
            console.error('❌ Error aplicando castigo:', error)
        }
    },

    async warnUser(sock, msg, sender, userNumber, warnings, analysis) {
        const remaining = this.config.maxWarnings - warnings
        
        const categoryText = analysis.category === 'Porn' ? 'contenido explícito' : 
                           analysis.category === 'Hentai' ? 'contenido inapropiado' : 
                           'contenido sugestivo'
        
        let warningMsg
        if (remaining === 1) {
            warningMsg = `Oye @${userNumber}, acabas de enviar ${categoryText} y eso no está permitido aquí.

✩ Ya llevas ${warnings} advertencia(s) de ${this.config.maxWarnings}
✩ Te queda solo UNA más antes de que te saque del grupo
✩ El contenido ya fue eliminado

En serio, la próxima vez que pase esto te vas directo afuera. Mantén el grupo limpio porfa 🙏`
        } else {
            warningMsg = `Hey @${userNumber}, no envíes ${categoryText} por favor.

✩ Advertencia ${warnings} de ${this.config.maxWarnings}
✩ Te quedan ${remaining} oportunidades más
✩ Ya eliminé lo que enviaste

Cuida lo que compartes en el grupo, no queremos tener que sacarte 👀`
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: warningMsg,
            mentions: [sender]
        })
    },

    async kickUser(sock, msg, sender, userNumber, analysis) {
        const categoryText = analysis.category === 'Porn' ? 'contenido explícito' : 
                           analysis.category === 'Hentai' ? 'contenido inapropiado' : 
                           'contenido sugestivo'
        
        let kickMsg
        if (analysis.severity === 'high') {
            kickMsg = `@${userNumber} ha sido expulsado del grupo.

Motivo: Envió ${categoryText} de gravedad alta
Confianza de detección: ${analysis.confidence}%

Este tipo de contenido no tiene ni una sola oportunidad aquí. Adiós 👋`
        } else {
            kickMsg = `@${userNumber} alcanzó el límite de advertencias y ha sido expulsado.

Razón: Envío repetido de ${categoryText}
Última detección: ${analysis.confidence}% de confianza

Se le dio suficientes oportunidades pero no respetó las reglas del grupo 🚪`
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: kickMsg,
            mentions: [sender]
        })

        await new Promise(resolve => setTimeout(resolve, this.config.kickDelay))
        
        try {
            const response = await sock.groupParticipantsUpdate(
                msg.key.remoteJid,
                [sender],
                'remove'
            )

            if (response[0]?.status === '200') {
                await updateGroupWarnings(msg.key.remoteJid, sender, 0)
            }
        } catch (error) {
            console.error('❌ Error expulsando usuario:', error)
        }
    },

    async deleteMessage(sock, msg) {
        await new Promise(resolve => setTimeout(resolve, this.config.deleteDelay))
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { delete: msg.key })
            console.log('🗑️ Contenido NSFW eliminado')
        } catch (error) {
            console.error('❌ Error eliminando mensaje:', error)
        }
    },

    setSensitivity(level) {
        switch (level) {
            case 'low':
                this.config.threshold = 0.8
                this.config.strictMode = false
                break
            case 'medium':
                this.config.threshold = 0.6
                this.config.strictMode = false
                break
            case 'high':
                this.config.threshold = 0.4
                this.config.strictMode = true
                break
            default:
                this.config.threshold = 0.6
                this.config.strictMode = false
        }
        console.log(`🔧 Sensibilidad ajustada a: ${level}`)
    },

    getStats() {
        return {
            enabled: this.enabled,
            modelLoaded: !!this.model,
            threshold: this.config.threshold,
            strictMode: this.config.strictMode,
            maxWarnings: this.config.maxWarnings
        }
    }
}

module.exports = {
    antinsfwEvent,
    default: antinsfwEvent
}