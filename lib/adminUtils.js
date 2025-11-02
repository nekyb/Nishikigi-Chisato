const isBotAdmin = async (client, groupId) => {
    try {
        if (!groupId.endsWith('@g.us')) return true; // No es un grupo
        
        const groupMetadata = await client.groupMetadata(groupId)
        const participants = groupMetadata.participants || []
        const botNumber = client.user.id.split(':')[0]
        
        const admin = participants.find(p => {
            const participantId = p.id?.split('@')?.[0]
            return participantId === botNumber && (p.admin === 'admin' || p.admin === 'superadmin')
        })
        return admin !== undefined
    } catch (error) {
        console.error('Error al verificar admin status del bot:', error)
        return false
    }
}

const isUserAdmin = async (client, groupId, userId) => {
    try {
        if (!groupId.endsWith('@g.us')) return true; // No es un grupo
        
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