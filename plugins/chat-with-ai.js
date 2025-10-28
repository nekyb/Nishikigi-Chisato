import axios from 'axios'
const aiCommand = {
    name: 'ai',
    aliases: ['ia', 'pregunta'],
    category: 'utils',
    description: 'Chatea con la IA y obtén respuestas inteligentes',
    usage: '#ai [pregunta o texto]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #ai ¿Cuál es la capital de Francia?\n` +
                        `✿ #ai Explícame qué es la inteligencia artificial`
                })
            }
            const userText = args.join(' ')
            await sock.sendMessage(chatId, {
                text: '《✧》 Consultando con genesis...'
            });
            const encodedText = encodeURIComponent(userText);
            const response = await axios.get(`https://gpt-oss-bat.drexelxx.workers.dev/?ask=${encodedText}`, { timeout: 15000 })
            if (!response.data || !response.data.response) { return await sock.sendMessage(chatId, { text: '《✧》 La IA no pudo generar una respuesta. Intenta de nuevo.' })
            } let aiResponse = response.data.response
            aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '*$1*')
            aiResponse = aiResponse.replace(/\n{3,}/g, '\n\n')
            await sock.sendMessage(chatId, { text: `《✧》 *Respuesta de la IA* \n\n${aiResponse}`})
        } catch (error) {console.error('Error en comando ai:', error);
            let errorMessage = '《✧》 Ocurrió un error al consultar con la IA'
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') { errorMessage = '《✧》 La solicitud tardó demasiado. Intenta de nuevo.' } else if (error.response?.status === 404) {errorMessage = '《✧》 El servicio de IA no está disponible en este momento.'} else if (!error.response) {errorMessage = '《✧》 No se pudo conectar con el servicio de IA.'} await sock.sendMessage(chatId, {text: errorMessage})
        }
    }
}
export default aiCommand