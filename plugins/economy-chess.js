import { loadUsers, saveUsers } from '../lib/database.js';
import { getUserId, getChatId } from '../lib/getUserId.js';
const COOLDOWN_TIME = 15 * 60 * 1000;
const chestResults = [
    { text: 'un cofre oxidado en el bosque', min: 100, max: 800 },
    { text: 'un cofre enterrado en la playa', min: 500, max: 1500 },
    { text: 'un cofre antiguo en una cueva', min: 800, max: 2500 },
    { text: 'un cofre dorado en las ruinas', min: 1500, max: 4000 },
    { text: 'un cofre legendario en el templo', min: 3000, max: 8000 },
    { text: 'un pequeño cofre abandonado', min: 200, max: 1000 },
    { text: 'un cofre místico en el santuario', min: 2000, max: 5500 },
    { text: 'un cofre del tesoro pirata', min: 1000, max: 3500 }
];
const chessCommand = {
    name: 'chess',
    aliases: ['cofre'],
    category: 'economy',
    description: 'Busca un cofre del tesoro',
    usage: '#chess o #cofre',
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
            if (user.last_chess) {
                const now = Date.now();
                const lastChess = new Date(user.last_chess).getTime();
                const timeLeft = (lastChess + COOLDOWN_TIME) - now;
                if (timeLeft > 0) {
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    const timeString = minutes > 0
                        ? `${minutes} minuto${minutes > 1 ? 's' : ''} y ${seconds} segundo${seconds > 1 ? 's' : ''}`
                        : `${seconds} segundo${seconds > 1 ? 's' : ''}`;
                    await sock.sendMessage(chatId, {
                        text: `ᯓ★ Tienes que esperar *${timeString}* para buscar otro cofre.`
                    }, { quoted: msg });
                    return;
                }
            }
            const randomChest = chestResults[Math.floor(Math.random() * chestResults.length)];
            const foundCoins = Math.floor(Math.random() * (randomChest.max - randomChest.min + 1)) + randomChest.min;
            user.coins += foundCoins;
            user.last_chess = new Date().toISOString();
            await saveUsers(users);
            await sock.sendMessage(chatId, {
                text: `ᯓ★ Has encontrado ${randomChest.text} y obtuviste *${foundCoins.toLocaleString()}* Coins.`
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando chess:', error);
            await sock.sendMessage(chatId, {
                text: '《✿》 Error al buscar el cofre.'
            }, { quoted: msg });
        }
    }
};
export default chessCommand;