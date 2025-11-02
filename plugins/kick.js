import { isBotAdmin, isUserAdmin } from '../lib/adminUtils.js'

export default {
    name: 'kick',
    aliases: ['expulsar'],
    category: 'admin',
    desc: 'Expulsar a un miembro del grupo',
    async execute(client, msg, args) {
        try {
            // Verificar si el mensaje es de un grupo
            const chat = msg.key.remoteJid;
            if (!chat.endsWith('@g.us')) {
                return await client.sendMessage(chat, {
                    text: 'Este comando solo puede ser usado en grupos.'
                }, { quoted: msg });
            }

            // Verificar si el bot es admin
            const botIsAdmin = await isBotAdmin(client, chat)
            if (!botIsAdmin) {
                return await client.sendMessage(chat, {
                    text: 'El bot necesita ser administrador para usar este comando.'
                }, { quoted: msg });
            }

            // Verificar si el usuario que ejecuta el comando es admin
            const sender = msg.key.participant || msg.key.remoteJid;
            const userIsAdmin = await isUserAdmin(client, chat, sender)
            if (!userIsAdmin) {
                return await client.sendMessage(chat, {
                    text: 'Solo los administradores pueden usar este comando.'
                }, { quoted: msg });
            }

            // Verificar si se mencionó a alguien
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentions.length === 0) {
                return await client.sendMessage(chat, {
                    text: 'Por favor, menciona al usuario que quieres expulsar.'
                }, { quoted: msg });
            }

            const mentionedUser = mentions[0]
            
            // Verificar que el usuario mencionado no sea admin
            const mentionedIsAdmin = await isUserAdmin(client, chat, mentionedUser)
            if (mentionedIsAdmin) {
                return await client.sendMessage(chat, {
                    text: 'No puedo expulsar a un administrador.'
                }, { quoted: msg });
            }

            // Expulsar al usuario
            await client.groupParticipantsUpdate(chat, [mentionedUser], "remove")
            await client.sendMessage(chat, {
                text: 'Usuario expulsado exitosamente.',
                mentions: [mentionedUser]
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en comando kick:', error)
            await msg.reply('Ocurrió un error al intentar expulsar al usuario.')
        }
    }
}