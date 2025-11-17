const sbpCommand = {
    name: 'sbp',
    aliases: ['soblend'],
    category: 'info',
    description: 'Info sobre @soblend/baileys',
    usage: '#sbp',
    
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid
        
        try {
            await sock.sendMessage(chatId, {
                text: `🚀 *@soblend/baileys*

Librería optimizada de Baileys.

🔥 Más rápido
🎯 Botones que funcionan
💾 Base de datos incluida

\`npm install @soblend/baileys\``,
                footer: 'by soblend',
                buttons: [
                    {
                        buttonId: 'sbp_features',
                        buttonText: { displayText: '✨ Características' },
                        type: 1
                    },
                    {
                        buttonId: 'sbp_install',
                        buttonText: { displayText: '📥 Instalación' },
                        type: 1
                    },
                    {
                        buttonId: 'sbp_docs',
                        buttonText: { displayText: '📚 Docs' },
                        type: 1
                    }
                ]
            }, { quoted: msg })
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `✘ Error: ${error.message}`
            }, { quoted: msg })
        }
    },
    
    async handleButton(sock, msg, buttonId) {
        const chatId = msg.key.remoteJid
        const responses = {
            'sbp_features': `📋 *Características*

🔥 Rendimiento: 3-5x más rápido
💚 RAM: 80MB (50% menos)
🎠 Carouseles con 10 tarjetas
🛡️ Admin de grupos completo
🔄 Auto-actualización desde NPM
📊 Dashboard en tiempo real
🔐 Backups cifrados AES-256`,

            'sbp_install': `📥 *Instalación*

\`\`\`bash
npm install @soblend/baileys
\`\`\`

\`\`\`javascript
import { SoblendBaileys } from '@soblend/baileys';

const bot = new SoblendBaileys({
  printQRInTerminal: true
});

const socket = await bot.connect('session');
\`\`\`

🔗 github.com/nekyb/baileys`,

            'sbp_docs': `📚 *Documentación*

*GitHub:* github.com/nekyb/baileys
*NPM:* npmjs.com/package/@soblend/baileys

*Módulos:*
• Conexión optimizada
• Mensajes interactivos
• Admin de grupos
• Base de datos
• Dashboard web

*Versión:* 1.0.5
*Licencia:* MIT`
        }
        
        await sock.sendMessage(chatId, {
            text: responses[buttonId] || '❌ Opción no válida'
        }, { quoted: msg })
    }
}

export default sbpCommand