const isBotAdmin = async (client, groupId) => {
    try {
        if (!groupId.endsWith('@g.us')) {
            return true
        }

        const groupMetadata = await client.groupMetadata(groupId)
        const participants = groupMetadata.participants || []
        const botNumber = client.user.id.split(':')[0].split('@')[0]
        const botParticipant = participants.find(p => {
            const participantId = p.id?.split('@')?.[0]
            const participantIdWithoutColon = participantId?.split(':')[0]
            return participantId === botNumber ||
                   participantIdWithoutColon === botNumber ||
                   p.id === client.user.id ||
                   p.id === `${botNumber}@s.whatsapp.net` ||
                   p.id === `${botNumber}@lid` ||
                   p.id === `${botNumber}:48@lid` ||
                   participantId?.includes(botNumber)
        })

        if (botParticipant) {
            const isAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin'
            return isAdmin
        }

        try {
            await client.groupMetadata(groupId)
            return true
        } catch (error) {
            return false
        }
    } catch (error) {
        console.error('❌ ERROR [isBotAdmin]:', error.message)
        console.error('📋 Stack:', error.stack)
        return false
    }
}

const isUserAdmin = async (client, groupId, userId) => {

    try {
        if (!groupId.endsWith('@g.us')) {
            return true
        }

        const groupMetadata = await client.groupMetadata(groupId)
        const participants = groupMetadata.participants || []
        const userNumber = userId.split('@')[0]
        const admin = participants.find(p => {
            const participantId = p.id?.split('@')?.[0]
            return participantId === userNumber && (p.admin === 'admin' || p.admin === 'superadmin')
        })

        const isAdmin = admin !== undefined
        return isAdmin
    } catch (error) {
        console.error('❌ ERROR [isUserAdmin]:', error.message)
        console.error('📋 Stack:', error.stack)
        return false
    }
}

export { isBotAdmin, isUserAdmin }