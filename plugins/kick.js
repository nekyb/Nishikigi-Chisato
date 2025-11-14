import { isBotAdmin, isUserAdmin } from '../lib/adminUtils.js'

export default {
    name: 'kick',
    aliases: ['expulsar'],
    category: 'admin',
    desc: 'Expulsar a un miembro del grupo',
    async execute(client, msg, args) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔍 DEBUG [KICK]: Comando iniciado')

        try {
            const chat = msg.key.remoteJid;
            console.log('📍 DEBUG: Chat ID:', chat)

            if (!chat.endsWith('@g.us')) {
                console.log('❌ DEBUG: No es un grupo')
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                return await client.sendMessage(chat, {
                    text: 'Este comando solo puede ser usado en grupos.'
                }, { quoted: msg });
            }

            console.log('✅ DEBUG: Es un grupo válido')

            console.log('🤖 DEBUG: Verificando si bot es admin...')
            const botIsAdmin = await isBotAdmin(client, chat)
            console.log('🤖 DEBUG: Bot es admin:', botIsAdmin)

            if (!botIsAdmin) {
                console.log('❌ DEBUG: Bot NO es admin, abortando')
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                return await client.sendMessage(chat, {
                    text: 'El bot necesita ser administrador para usar este comando.'
                }, { quoted: msg });
            }

            const sender = msg.key.participant || msg.key.remoteJid;
            console.log('👤 DEBUG: Sender:', sender)
            console.log('👤 DEBUG: Verificando si sender es admin...')

            const userIsAdmin = await isUserAdmin(client, chat, sender)
            console.log('👤 DEBUG: Sender es admin:', userIsAdmin)

            if (!userIsAdmin) {
                console.log('❌ DEBUG: Sender NO es admin, abortando')
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                return await client.sendMessage(chat, {
                    text: 'Solo los administradores pueden usar este comando.'
                }, { quoted: msg });
            }

            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            console.log('📝 DEBUG: Menciones encontradas:', mentions.length)
            console.log('📝 DEBUG: Menciones:', mentions)

            if (mentions.length === 0) {
                console.log('❌ DEBUG: No hay menciones')
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                return await client.sendMessage(chat, {
                    text: 'Por favor, menciona al usuario que quieres expulsar.'
                }, { quoted: msg });
            }

            const mentionedUser = mentions[0]
            console.log('🎯 DEBUG: Usuario a expulsar:', mentionedUser)

            console.log('🔎 DEBUG: Verificando si usuario mencionado es admin...')
            const mentionedIsAdmin = await isUserAdmin(client, chat, mentionedUser)
            console.log('🔎 DEBUG: Usuario mencionado es admin:', mentionedIsAdmin)

            if (mentionedIsAdmin) {
                console.log('❌ DEBUG: No se puede expulsar a un admin')
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                return await client.sendMessage(chat, {
                    text: 'No puedo expulsar a un administrador.'
                }, { quoted: msg });
            }

            console.log('⚡ DEBUG: Ejecutando expulsión...')
            const result = await client.groupParticipantsUpdate(chat, [mentionedUser], "remove")
            console.log('📊 DEBUG: Resultado de expulsión:', result)

            await client.sendMessage(chat, {
                text: 'Usuario expulsado exitosamente.',
                mentions: [mentionedUser]
            }, { quoted: msg });

            console.log('✅ DEBUG: Usuario expulsado exitosamente')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        } catch (error) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.error('❌ ERROR [KICK]:', error.message)
            console.error('📋 Stack:', error.stack)
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            await msg.reply('Ocurrió un error al intentar expulsar al usuario.')
        }
    }
}
