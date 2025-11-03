import { getGroupSettings, updateGroupWarnings } from '../database/users.js'

export const antilinkEvent = {
    name: 'antilink',
    enabled: true,
    
    patterns: {
        general: /\b((https?:\/\/|www\.)[\w-]+\.[\w-]+(?:\.[\w-]+)*(\/[\w\.\-\/#?&=]*)?)\b/gi,
        whatsapp: /(https?:\/\/)?(chat\.whatsapp\.com|wa\.me|whatsapp\.com)\/([\w\d]+)/gi,
        shorteners: /(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|short\.link|cutt\.ly)/gi
    },

    config: {
        maxWarnings: 3,          // Advertencias antes de expulsar
        deleteDelay: 1000,       // Delay antes de eliminar mensaje
        kickDelay: 2000,         // Delay antes de expulsar
        warnExpiration: 3600000, // Tiempo para resetear warnings (1 hora)
    },

    whitelist: [
        'youtube.com',
        'youtu.be',
        'github.com',
        'docs.google.com',
    ],

    async handleMessage(sock, msg, isAdmin, isBotAdmin) {
        try {if (!msg.isGroup || isAdmin) return false
            const groupJid = msg.key.remoteJid
            const settings = await getGroupSettings(groupJid)
            if (!settings?.antilink) return false
            const messageText = this.getMessageText(msg)
            if (!messageText) return false
            const detection = this.detectLinks(messageText)
            if (!detection.hasLinks) return false
            if (!isBotAdmin) {await this.sendBotNotAdminWarning(sock, groupJid)
                return false}
            if (await this.isWhitelisted(sock, groupJid, messageText, detection)) {
                return false}

            // Aplicar acción (warning o kick)
            await this.applyPunishment(sock, msg, detection)
            
            return true

        } catch (error) {
            console.error('❌ Error en antilink event:', error)
            return false
        }
    },

    detectLinks(text) {
        const generalLinks = text.match(this.patterns.general) || []
        const whatsappLinks = text.match(this.patterns.whatsapp) || []
        const shortenerLinks = text.match(this.patterns.shorteners) || []
        return {
            hasLinks: generalLinks.length > 0,
            general: generalLinks,
            whatsapp: whatsappLinks,
            shorteners: shortenerLinks,
            total: generalLinks.length,
            types: {
                hasWhatsApp: whatsappLinks.length > 0,
                hasShortener: shortenerLinks.length > 0,}}},

    async isWhitelisted(sock, groupJid, messageText, detection) {
        try {const isGlobalWhitelist = this.whitelist.some(allowed => 
                messageText.toLowerCase().includes(allowed.toLowerCase()))
            if (isGlobalWhitelist) return true
            if (detection.types.hasWhatsApp) {const groupInviteCode = await sock.groupInviteCode(groupJid).catch(() => null)
                if (groupInviteCode) {
                    const thisGroupLink = `https://chat.whatsapp.com/${groupInviteCode}`
                    if (messageText.includes(groupInviteCode) || messageText.includes(thisGroupLink)) {
                        return true}}}
            return false} catch (error) {console.error('Error verificando whitelist:', error)
            return false}},

    async applyPunishment(sock, msg, detection) {
        const groupJid = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        const userNumber = sender.split('@')[0]
        try {
            const warnings = await this.getUserWarnings(groupJid, sender)
            const newWarnings = warnings + 1
            if (newWarnings >= this.config.maxWarnings) {
                await this.kickUser(sock, msg, sender, userNumber, detection)} else {
                await this.warnUser(sock, msg, sender, userNumber, newWarnings, detection)}
            await updateGroupWarnings(groupJid, sender, newWarnings)
            await this.deleteMessage(sock, msg)} catch (error) {console.error('Error aplicando castigo:', error)}},

    async warnUser(sock, msg, sender, userNumber, warnings, detection) {
        const remaining = this.config.maxWarnings - warnings
        const linkType = detection.types.hasWhatsApp ? 'WhatsApp' : 
                        detection.types.hasShortener ? 'acortado' : 'externo'
        const warningMsg = `╭━━━『 ⚠️ ADVERTENCIA 』━━━╮
│
│ ✩ Usuario: @${userNumber}
│ ✩ Infracción: Link ${linkType} detectado
│ ✩ Advertencias: ${warnings}/${this.config.maxWarnings}
│ ✩ Restantes: ${remaining}
│
│ ✩ Próxima infracción:
│ ${remaining === 1 ? '❌ SERÁS EXPULSADO' : `⚠️ Te quedan ${remaining} advertencias`}
│
╰━━━━━━━━━━━━━━━━━━━╯

_Powered By Soblend_`

        await sock.sendMessage(msg.key.remoteJid, {
            text: warningMsg,
            mentions: [sender]})},

    async kickUser(sock, msg, sender, userNumber, detection) {
        const linkType = detection.types.hasWhatsApp ? 'WhatsApp' : 
                        detection.types.hasShortener ? 'acortado' : 'externo'
        const kickMsg = `╭━━━『 🚫 EXPULSIÓN 』━━━╮
│
│ ✩ Usuario: @${userNumber}
│ ✩ Motivo: Límite de advertencias alcanzado
│ ✩ Tipo: Link ${linkType}
│ ✩ Infracciones: ${this.config.maxWarnings}/${this.config.maxWarnings}
│
│ ✩ El usuario ha sido removido del grupo
│
╰━━━━━━━━━━━━━━━━━━━╯

_*Soblend* | Las reglas son reglas, y deben de cumplirse_`

        await sock.sendMessage(msg.key.remoteJid, {
            text: kickMsg,
            mentions: [sender]})

 await new Promise(resolve => setTimeout(resolve, this.config.kickDelay))
        try {const response = await sock.groupParticipantsUpdate(
                msg.key.remoteJid,
                [sender],
                'remove')

            if (response[0]?.status === '404') {
                console.log('⚠️ Usuario no encontrado en el grupo')} else if (response[0]?.status === '200') {console.log('✅ Usuario expulsado exitosamente')}
            await updateGroupWarnings(msg.key.remoteJid, sender, 0)} catch (error) {console.error('❌ Error expulsando usuario:', error)
            await sock.sendMessage(msg.key.remoteJid, {text: '❌ No pude expulsar al usuario. Verifica mis permisos.'})}},

    async deleteMessage(sock, msg) {
        await new Promise(resolve => setTimeout(resolve, this.config.deleteDelay))
        try {await sock.sendMessage(msg.key.remoteJid, {delete: msg.key})} catch (error) {console.error('❌ Error eliminando mensaje:', error)}},

    /**
     * Obtiene warnings del usuario (simulado, implementar con BD real)
     */
    async getUserWarnings(groupJid, userJid) {
        try {
            return await getGroupWarnings(groupJid, userJid)
        } catch (error) {
            console.error('Error en getUserWarnings:', error)
            return 0
        }
    },

    async sendBotNotAdminWarning(sock, groupJid) {await sock.sendMessage(groupJid, {
            text: '⚠️ *Antilink activado pero no soy administrador*\n\n' +
                  'Para que el antilink funcione correctamente necesito:\n' +
                  '• ✅ Ser administrador del grupo\n' +
                  '• 🗑️ Poder eliminar mensajes\n' +
                  '• 👥 Poder remover participantes\n\n' +
                  '_Promuéveme a admin para activar la protección_'})},

    getMessageText(msg) {
        try {const message = msg.message      
            if (message?.conversation) {return message.conversation}
            if (message?.extendedTextMessage?.text) {return message.extendedTextMessage.text}
            if (message?.imageMessage?.caption) {return message.imageMessage.caption}
            if (message?.videoMessage?.caption) {return message.videoMessage.caption}
            if (message?.documentMessage?.caption) {return message.documentMessage.caption}
            if (message?.buttonsResponseMessage?.selectedDisplayText) {return message.buttonsResponseMessage.selectedDisplayText}
            if (message?.listResponseMessage?.title) {return message.listResponseMessage.title}
            return null} catch (error) {console.error('Error extrayendo texto:', error)
            return null}},

    async resetWarnings(groupJid, userJid) {
        try {await updateGroupWarnings(groupJid, userJid, 0)
            return true} catch (error) {console.error('Error reseteando warnings:', error)
            return false}}}
export default antilinkEvent