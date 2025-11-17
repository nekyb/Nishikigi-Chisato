import { reloadCommands } from '../handlers/commands.js'
import { loadEvents } from '../handlers/events.js'
import { clearCache } from '../utils/cache.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const updateCommand = {
    name: 'update',
    aliases: ['reload', 'refresh', 'reiniciar'],
    category: 'owner',
    description: 'Actualiza los componentes del bot sin reiniciarlo',
    usage: '#update',
    ownerOnly: true,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        
        try {
            const message = await sock.sendMessage(chatId, {
                text: `*╭─❲ 𝗔𝗰𝘁𝘂𝗮𝗹𝗶𝘇𝗮𝗻𝗱𝗼... ❳*\n│\n│ _Iniciando actualización..._\n│\n╰─────────────────────❋ `, 
                contextInfo: {
                    externalAdReply: {
                        title: "Soblend | Niskikigi Chisato",
                        body: "By DeltaByte",
                        thumbnailUrl: "https://i.ibb.co/hBR5TNj/update.jpg",
                        sourceUrl: "",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg })
            let status = []
            let errors = []
            if (!global._dynamicImports) {
                global._dynamicImports = new Map()
            }

            try {
                await reloadCommands()
                status.push('✅ Comandos actualizados')
            } catch (e) {
                console.error('Error recargando comandos:', e)
                errors.push('❌ Error al actualizar comandos')
            }

            try {
                await loadEvents()
                status.push('✅ Eventos actualizados')
            } catch (e) {
                console.error('Error recargando eventos:', e)
                errors.push('❌ Error al actualizar eventos')
            }

            try {
                await clearCache()
                status.push('✅ Caché limpiada')
            } catch (e) {
                console.error('Error limpiando caché:', e)
                errors.push('❌ Error al limpiar caché')
            }

            try {
                const configPath = new URL('../config/bot.js', import.meta.url)
                console.log('Intentando cargar config desde:', configPath.pathname)
                const config = await import(configPath + '?update=' + Date.now())
                global.config = config.default || config
                status.push('✅ Configuración actualizada')
            } catch (e) {
                console.error('Error recargando config:', e)
                errors.push('❌ Error al actualizar configuración')
            }

            try {
                if (global.db) {
                    await global.db.save()
                    status.push('✅ Base de datos sincronizada')
                }
            } catch (e) {
                console.error('Error sincronizando DB:', e)
                errors.push('❌ Error al sincronizar base de datos')
            }

            let finalMessage = `*╭─❲ 𝗔𝗰𝘁𝘂𝗮𝗹𝗶𝘇𝗮𝗰𝗶𝗼𝗻 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗮 ❳*\n│\n`
            if (status.length > 0) {
                finalMessage += `│ *Componentes Actualizados:*\n`
                status.forEach(s => finalMessage += `│ ${s}\n`)
            }
            
            if (errors.length > 0) {
                finalMessage += `│\n│ *Errores Encontrados:*\n`
                errors.forEach(e => finalMessage += `│ ${e}\n`)
            }
            
            finalMessage += `│\n│ *Estado:* ${errors.length === 0 ? '✅ Todo OK' : '⚠️ Con errores'}\n`
            finalMessage += `│\n╰────────────────────❋`
            await sock.sendMessage(chatId, { 
                text: finalMessage,
                edit: message.key
            })

        } catch (error) {
            console.error('Error en comando update:', error)
            await sock.sendMessage(chatId, {
                text: `*╭─❲ 𝗘𝗿𝗿𝗼𝗿 ❳*\n│\n│ ❌ Error al actualizar el bot\n│\n╰──────────────❋`
            }, { quoted: msg })
        }
    }
}

export default updateCommand