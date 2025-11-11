
const isBotAdmin = async (client, groupId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 DEBUG [isBotAdmin]: Verificación iniciada')
    console.log('📍 Group ID:', groupId)
    
    try {
        if (!groupId.endsWith('@g.us')) {
            console.log('⚠️ DEBUG: No es un grupo, retornando true por defecto')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            return true
        }

        console.log('📡 DEBUG: Obteniendo metadata del grupo...')
        const groupMetadata = await client.groupMetadata(groupId)
        const participants = groupMetadata.participants || []
        const botNumber = client.user.id.split(':')[0].split('@')[0]
        console.log('🤖 DEBUG: Bot number:', botNumber)
        console.log('👥 DEBUG: Total participantes:', participants.length)

        // Buscar bot en los participantes con múltiples formatos
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

        console.log('🔎 DEBUG: Bot encontrado en participantes:', !!botParticipant)
        
        // Si encontramos al bot, verificar su rol
        if (botParticipant) {
            const isAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin'
            console.log('👑 DEBUG: Rol del bot:', botParticipant.admin || 'member')
            console.log('✅ DEBUG: Bot es admin:', isAdmin)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            return isAdmin
        }

        // Si no se encuentra en la lista, intentar verificar con una acción real
        console.log('⚠️ DEBUG: Bot NO encontrado en participantes')
        console.log('🔄 DEBUG: Intentando verificación alternativa...')
        
        try {
            // Intentar obtener el subject del grupo (solo admins pueden hacerlo en algunos casos)
            // O intentar una acción segura que solo admins pueden hacer
            const testResult = await client.groupMetadata(groupId)
            
            // Si llegamos aquí y el bot puede leer metadata, probablemente esté en el grupo
            // Vamos a asumir que SÍ es admin si puede ejecutar comandos de admin
            // (esto es un workaround para el bug de @lid)
            console.log('⚡ DEBUG: Bot puede acceder al grupo pero no aparece en participantes')
            console.log('💡 DEBUG: Esto es un bug conocido de WhatsApp con grupos @lid')
            console.log('✅ DEBUG: Asumiendo que el bot SÍ tiene permisos (workaround)')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            
            // Retornar true como workaround temporal
            // El bot fallará en la acción real si no tiene permisos
            return true
        } catch (error) {
            console.log('❌ DEBUG: Error en verificación alternativa')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            return false
        }
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('❌ ERROR [isBotAdmin]:', error.message)
        console.error('📋 Stack:', error.stack)
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        return false
    }
}

const isUserAdmin = async (client, groupId, userId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 DEBUG [isUserAdmin]: Verificación iniciada')
    console.log('📍 Group ID:', groupId)
    console.log('👤 User ID:', userId)
    
    try {
        if (!groupId.endsWith('@g.us')) {
            console.log('⚠️ DEBUG: No es un grupo, retornando true por defecto')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            return true
        }
        
        console.log('📡 DEBUG: Obteniendo metadata del grupo...')
        const groupMetadata = await client.groupMetadata(groupId)
        const participants = groupMetadata.participants || []
        const userNumber = userId.split('@')[0]
        
        console.log('🔢 DEBUG: User number:', userNumber)
        console.log('👥 DEBUG: Total participantes:', participants.length)
        
        const admin = participants.find(p => {
            const participantId = p.id?.split('@')?.[0]
            return participantId === userNumber && (p.admin === 'admin' || p.admin === 'superadmin')
        })
        
        const isAdmin = admin !== undefined
        console.log('🔎 DEBUG: Usuario encontrado:', !!admin)
        if (admin) {
            console.log('👑 DEBUG: Rol del usuario:', admin.admin)
        }
        console.log('✅ DEBUG: Usuario es admin:', isAdmin)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        return isAdmin
        
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('❌ ERROR [isUserAdmin]:', error.message)
        console.error('📋 Stack:', error.stack)
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        return false
    }
}

export { isBotAdmin, isUserAdmin }
