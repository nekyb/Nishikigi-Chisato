const offCommand = {
    name: 'off',
    aliases: ['apagar', 'shutdown', 'stop'],
    category: 'owner',
    description: 'Apaga el bot de manera segura',
    usage: '#off',
    ownerOnly: true,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            await sock.sendMessage(chatId, {
                text: `《✧》 *Apagando bot...*\n\n` +
                    `El bot se está cerrando de manera segura.\n` +
                    `✿ Guardando datos...\n` +
                    `✿ Cerrando conexiones...\n` +
                    `✿ Limpiando cache...\n\n` +
                    `¡Hasta pronto! `
            });
            console.log('《✧》 Bot apagándose por comando del owner...');
            setTimeout(async () => {
                try {
                    await sock.logout();
                    console.log('《✧》 Sesión cerrada exitosamente');
                }
                catch (error) {
                    console.log('《✧》 Error cerrando sesión:', error);
                }
                setTimeout(() => {
                    console.log('《✧》 Bot apagado exitosamente');
                    process.exit(0);
                }, 2000);
            }, 3000);
        }
        catch (error) {
            console.error('Error en comando off:', error);
            try {
                await sock.sendMessage(chatId, {
                    text: '《✧》 Ocurrió un error al intentar apagar el bot'
                });
            }
            catch (sendError) {
                console.error('Error enviando mensaje de error:', sendError);
            }
            setTimeout(() => {
                console.log('《✧》 Apagando bot después de error...');
                process.exit(1);
            }, 2000);
        }
    }
};
export default offCommand;