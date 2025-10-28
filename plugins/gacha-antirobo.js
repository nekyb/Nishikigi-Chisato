const antiroboCommand = {
    name: 'antirobo',
    aliases: ['proteger'],
    category: 'gacha',
    description: 'Protege tus waifus de robos',
    usage: '#antirobo <hora|dia|semana|mes>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const user = msg.key.participant || msg.key.remoteJid;
        if (!global.db) {
            global.db = { data: { users: {} } };
        }
        if (!global.db.data) {
            global.db.data = { users: {} };
        }
        if (!global.db.data.users) {
            global.db.data.users = {};
        }
        const users = global.db.data.users;
        let userData = users[user];
        if (!userData) {
            userData = users[user] = { monedas: 0, antirobo: 0 };
        }
        if (!args[0] || !['hora', 'dia', 'semana', 'mes'].includes(args[0].toLowerCase())) {
            return await sock.sendMessage(chatId, {
                text: `✘ Uso incorrecto.\nFormato correcto:\n\n` +
                    `*#antirobo hora*  (30,000 monedas - 1 hora)\n` +
                    `*#antirobo dia*   (500,000 monedas - 1 día)\n` +
                    `*#antirobo semana* (2,000,000 monedas - 1 semana)\n` +
                    `*#antirobo mes*   (5,000,000 monedas - 1 mes)`
            }, { quoted: msg });
        }
        const tipo = args[0].toLowerCase();
        let costo = 0;
        let duracion = 0;
        switch (tipo) {
            case 'hora':
                costo = 30000;
                duracion = 60 * 60 * 1000;
                break;
            case 'dia':
                costo = 500000;
                duracion = 24 * 60 * 60 * 1000;
                break;
            case 'semana':
                costo = 2000000;
                duracion = 7 * 24 * 60 * 60 * 1000;
                break;
            case 'mes':
                costo = 5000000;
                duracion = 30 * 24 * 60 * 60 * 1000;
                break;
        }
        if (userData.monedas < costo) {
            return await sock.sendMessage(chatId, {
                text: `✘ No tienes suficientes monedas.\nNecesitas *${costo.toLocaleString()}* monedas para activar el AntiRobo por ${tipo}.`
            }, { quoted: msg });
        }
        userData.monedas -= costo;
        userData.antirobo = Date.now() + duracion;
        await sock.sendMessage(chatId, {
            text: `✅ *AntiRobo activado* por *${tipo}*.\n🛡 Tus waifus estarán protegidas hasta:\n*${new Date(userData.antirobo).toLocaleString()}*`
        }, { quoted: msg });
    }
};
export default antiroboCommand;