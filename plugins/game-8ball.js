export default {
    name: '8ball',
    aliases: ['bola8', 'pregunta', 'ask'],
    category: 'games',
    description: 'Pregúntale a la bola mágica 8',
    usage: '#8ball [pregunta]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Bola Mágica 8* 🎱\n\n` +
                        `Hazme una pregunta de sí o no\n\n` +
                        `Ejemplos:\n` +
                        `✿ #8ball ¿Aprobaré el examen?\n` +
                        `✿ #8ball ¿Debo salir hoy?\n` +
                        `✿ #8ball ¿Me quiere?`
                });
            }

            const question = args.join(' ');

            const responses = [
                '✅ Sí, definitivamente',
                '✅ Es cierto',
                '✅ Sin duda alguna',
                '✅ Sí, absolutamente',
                '✅ Puedes confiar en ello',
                '✅ Como yo lo veo, sí',
                '✅ Probablemente',
                '✅ Las señales apuntan a que sí',
                '🟡 Respuesta dudosa, intenta de nuevo',
                '🟡 Pregunta de nuevo más tarde',
                '🟡 Mejor no decírtelo ahora',
                '🟡 No puedo predecir ahora',
                '🟡 Concéntrate y pregunta de nuevo',
                '❌ No cuentes con ello',
                '❌ Mi respuesta es no',
                '❌ Mis fuentes dicen que no',
                '❌ Las perspectivas no son buenas',
                '❌ Muy dudoso',
                '🔮 El destino es incierto',
                '💫 Las estrellas dicen que sí',
                '💫 Las estrellas dicen que no',
                '🌟 Es tu destino',
                '⚡ Los dioses están de tu lado',
                '⚡ Los dioses no están de tu lado'
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            await sock.sendMessage(chatId, {
                text: `《✧》 *Bola Mágica 8* 🎱\n\n` +
                    `❓ *Pregunta:*\n${question}\n\n` +
                    `🔮 *Respuesta:*\n${randomResponse}`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en 8ball:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 ❌ Error al consultar la bola mágica.'
            });
        }
    }
};
