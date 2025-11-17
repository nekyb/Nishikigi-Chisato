import { getGroupSettings, updateGroupSettings } from '../database/users.js';
import { antinsfwEvent } from '../events/anti-porn.js';
import { isBotAdmin, isUserAdmin } from '../lib/adminUtils.js'

export default {
    name: 'antiporn',
    alias: ['antiporn', 'antinsfw'],
    category: 'admin',
    desc: 'Activa o desactiva la detección de contenido NSFW',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,

    async execute(sock, msg, args) {
        const groupId = msg.key.remoteJid;
        const settings = await getGroupSettings(groupId);
        
        if (args[0] === 'on') {
            if (settings?.antinsfw) {
                await sock.sendMessage(groupId, {
                    text: '❌ El anti-NSFW ya está activado en este grupo.'
                }, { quoted: msg });
                return;
            }

            try {
                if (!antinsfwEvent.model) {
                    await sock.sendMessage(groupId, {
                        text: '⌛ Cargando modelo NSFW, por favor espere...'
                    }, { quoted: msg });

                    await antinsfwEvent.initialize();
                    
                    if (!antinsfwEvent.model) {
                        await sock.sendMessage(groupId, {
                            text: '❌ Error cargando el modelo NSFW. No se pudo activar la protección.'
                        }, { quoted: msg });
                        return;
                    }
                }

                await updateGroupSettings(groupId, { antinsfw: true });

                await sock.sendMessage(groupId, {
                    text: `✅ *Anti-NSFW Activado*

🛡️ La protección contra contenido inapropiado ha sido activada.

📋 Funciones:
- Detecta imágenes y videos con contenido NSFW
- Elimina automáticamente el contenido detectado
- Sistema de advertencias para infractores
- Expulsión automática al exceder límite

⚠️ Configuración actual:
- Advertencias máximas: ${antinsfwEvent.config.maxWarnings}
- Sensibilidad: ${antinsfwEvent.config.strictMode ? 'Alta' : 'Normal'}
- Umbral de detección: ${antinsfwEvent.config.threshold * 100}%

_El bot debe ser administrador para funcionar correctamente_`
                }, { quoted: msg });

            } catch (error) {
                console.error('Error activando anti-NSFW:', error);
                await sock.sendMessage(groupId, {
                    text: '❌ Ocurrió un error al activar el anti-NSFW.'
                }, { quoted: msg });
            }
            return;
        }

        if (args[0] === 'off') {
            if (!settings?.antinsfw) {
                await sock.sendMessage(groupId, {
                    text: '❌ El anti-NSFW ya está desactivado en este grupo.'
                }, { quoted: msg });
                return;
            }

            try {
                await updateGroupSettings(groupId, { antinsfw: false });
                
                await sock.sendMessage(groupId, {
                    text: '✅ Anti-NSFW desactivado exitosamente.'
                }, { quoted: msg });
                
            } catch (error) {
                console.error('Error desactivando anti-NSFW:', error);
                await sock.sendMessage(groupId, {
                    text: '❌ Ocurrió un error al desactivar el anti-NSFW.'
                }, { quoted: msg });
            }
            return;
        }

        if (args[0] === 'sensitivity') {
            const level = args[1]?.toLowerCase();
            
            if (!['low', 'medium', 'high'].includes(level)) {
                await sock.sendMessage(groupId, {
                    text: `❌ Nivel de sensibilidad inválido.

📋 Uso: .antiporn sensitivity <nivel>

📊 Niveles disponibles:
- low - Detección más permisiva
- medium - Balance entre precisión y falsos positivos
- high - Detección más estricta

Ejemplo: .antiporn sensitivity medium`
                }, { quoted: msg });
                return;
            }

            try {
                antinsfwEvent.setSensitivity(level);
                
                await sock.sendMessage(groupId, {
                    text: `✅ Sensibilidad ajustada a: ${level}

⚙️ Nueva configuración:
- Modo estricto: ${antinsfwEvent.config.strictMode ? 'Activado' : 'Desactivado'}
- Umbral de detección: ${antinsfwEvent.config.threshold * 100}%`
                }, { quoted: msg });
                
            } catch (error) {
                console.error('Error ajustando sensibilidad:', error);
                await sock.sendMessage(groupId, {
                    text: '❌ Ocurrió un error al ajustar la sensibilidad.'
                }, { quoted: msg });
            }
            return;
        }

        if (args[0] === 'status') {
            const stats = antinsfwEvent.getStats();
            
            await sock.sendMessage(groupId, {
                text: `📊 *Estado del Anti-NSFW*

🔄 Estado: ${settings?.antinsfw ? '✅ Activado' : '❌ Desactivado'}
🤖 Modelo: ${stats.modelLoaded ? '✅ Cargado' : '❌ No cargado'}

⚙️ Configuración:
- Advertencias máx: ${stats.maxWarnings}
- Modo estricto: ${stats.strictMode ? 'Sí' : 'No'}
- Umbral: ${stats.threshold * 100}%

📋 Uso:
- .antiporn on - Activar protección
- .antiporn off - Desactivar protección
- .antiporn sensitivity <low/medium/high>
- .antiporn status - Ver estado actual`
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(groupId, {
            text: `❌ Uso incorrecto del comando.

📋 Comandos disponibles:
- .antiporn on - Activa la protección
- .antiporn off - Desactiva la protección
- .antiporn sensitivity <low/medium/high>
- .antiporn status - Muestra el estado actual

Ejemplo: .antiporn on`
        }, { quoted: msg });
    }
};