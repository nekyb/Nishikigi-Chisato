import { loadUsers, saveUsers } from '../lib/database.js';
const COOLDOWN_TIME = 7 * 60 * 1000;
const workResponses = [
    { text: 'vendiendo globos durante toda la tarde', min: 500, max: 2000 },
    { text: 'repartiendo pizzas por la ciudad', min: 800, max: 2500 },
    { text: 'limpiando autos en el estacionamiento', min: 600, max: 1800 },
    { text: 'vendiendo limonada en el parque', min: 400, max: 1500 },
    { text: 'ayudando en una mudanza', min: 1000, max: 3000 },
    { text: 'cuidando mascotas del vecindario', min: 700, max: 2200 },
    { text: 'haciendo delivery en bicicleta', min: 900, max: 2800 },
    { text: 'vendiendo flores en la esquina', min: 550, max: 1900 },
    { text: 'lavando platos en un restaurante', min: 650, max: 2100 },
    { text: 'organizando eventos para niños', min: 1100, max: 3200 }
];
const workCommand = {
    name: 'work',
    aliases: ['w'],
    category: 'economy',
    description: 'Trabaja para ganar coins',
    usage: '#work o #w',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;
        try {
            const users = await loadUsers();
            if (!users[userId]) {
                let userName = 'Usuario';
                try {
                    const contact = await sock.onWhatsApp(userId);
                    if (contact && contact[0]?.notify) {
                        userName = contact[0].notify;
                    }
                }
                catch (e) {
                    console.log('No se pudo obtener el nombre del usuario');
                }
                users[userId] = {
                    name: userName,
                    coins: 0,
                    last_work: null,
                    last_daily: null,
                    last_chess: null,
                    last_crime: null,
                    last_slut: null,
                    daily_streak: 0,
                    registered_at: new Date().toISOString()
                };
            }
            const user = users[userId];
            if (user.last_work) {
                const now = Date.now();
                const lastWork = new Date(user.last_work).getTime();
                const timeLeft = (lastWork + COOLDOWN_TIME) - now;
                if (timeLeft > 0) {
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    const timeString = minutes > 0
                        ? `${minutes} minuto${minutes > 1 ? 's' : ''} y ${seconds} segundo${seconds > 1 ? 's' : ''}`
                        : `${seconds} segundo${seconds > 1 ? 's' : ''}`;
                    await sock.sendMessage(chatId, {
                        text: `ᯓ★ Tienes que esperar *${timeString}* para volver a usar el comando *#w*.`
                    }, { quoted: msg });
                    return;
                }
            }
            const randomWork = workResponses[Math.floor(Math.random() * workResponses.length)];
            const earnedCoins = Math.floor(Math.random() * (randomWork.max - randomWork.min + 1)) + randomWork.min;
            user.coins += earnedCoins;
            user.last_work = new Date().toISOString();
            await saveUsers(users);
            await sock.sendMessage(chatId, {
                text: `ᯓ★ Has trabajado ${randomWork.text} y ganaste *${earnedCoins.toLocaleString()}* Coins.`
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando work:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al procesar el trabajo.'
            }, { quoted: msg });
        }
    }
};
export default workCommand;