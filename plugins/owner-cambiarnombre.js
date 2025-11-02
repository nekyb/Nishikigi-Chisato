import { getChatId } from '../lib/getUserId.js';

const cambiarNombreCommand = {
    name: 'cambiarnombre',
    aliases: ['nuevonombrebot', 'setbotname', 'namebot'],
    category: 'owner',
    description: 'Cambia el nombre del bot',
    usage: '#cambiarnombre [nuevo nombre]',
    ownerOnly: true,
    async execute(sock, msg, args) {
        const chatId = getChatId(msg);
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ¿Qué nombre deseas ponerme?\n\nEjemplo: #cambiarnombre Orcalero Bot'
                });
            }
            const newName = args.join(' ');
            if (newName.length > 25) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 El nombre no puede tener más de 25 caracteres'
                });
            }
            if (newName.length < 3) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 El nombre debe tener al menos 3 caracteres'
                });
            }
            await sock.sendMessage(chatId, {
                text: '《✧》 Cambiando nombre del bot...'
            });
            await sock.updateProfileName(newName);
            await sock.sendMessage(chatId, {
                text: `《✧》 *Nombre cambiado con éxito*\n\n📝 Nuevo nombre: ${newName}`
            });
            console.log(`《✧》 Nombre del bot cambiado a: ${newName}`);
        }
        catch (error) {
            console.error('Error en comando cambiarnombre:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Ocurrió un error al cambiar el nombre del bot'
            });
        }
    }
};
export default cambiarNombreCommand;
//# sourceMappingURL=cambiarnombre.js.map