const isBotAdmin = async (client, groupId) => {
    try {
        if (!groupId.endsWith('@g.us')) return true;
        
        const groupMetadata = await client.groupMetadata(groupId)
        const participants = groupMetadata.participants || []
        const botNumber = client.user.id.split(':')[0].split('@')[0]
        
        // Buscar bot en los participantes
        const botParticipant = participants.find(p => {
            const participantId = p.id?.split('@')?.[0]
            return participantId === botNumber || 
                   p.id === client.user.id ||
                   p.id === `${botNumber}@s.whatsapp.net` ||
                   p.id === `${botNumber}@lid`
        })
        
        // Si encontramos al bot, verificar su rol
        if (botParticipant) {
            return botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin'
        }
        
        // Verificación alternativa: intentar cambiar configuración del grupo
        // Esto funciona cuando el bot no aparece en metadatos (ej: linked devices)
        try {
            const currentSetting = groupMetadata.announce || false
            const testSetting = currentSetting ? 'not_announcement' : 'announcement'
            
            await client.groupSettingUpdate(groupId, testSetting)
            // Si llegamos aquí, somos admin. Revertir el cambio
            await client.groupSettingUpdate(groupId, currentSetting ? 'announcement' : 'not_announcement')
            
            return true
        } catch (testError) {
            // No pudimos cambiar la configuración = no somos admin
            return false
        }
        
    } catch (error) {
        console.error('Error al verificar admin status del bot:', error)
        return false
    }
}

const isUserAdmin = async (client, groupId, userId) => {
    try {
        if (!groupId.endsWith('@g.us')) return true;
        
        const groupMetadata = await client.groupMetadata(groupId)
        const participants = groupMetadata.participants || []
        const userNumber = userId.split('@')[0]
        
        const admin = participants.find(p => {
            const participantId = p.id?.split('@')?.[0]
            return participantId === userNumber && (p.admin === 'admin' || p.admin === 'superadmin')
        })
        
        return admin !== undefined
        
    } catch (error) {
        console.error('Error al verificar admin status del usuario:', error)
        return false
    }
}

export {
    isBotAdmin,
    isUserAdmin
}