import { loadUsers, saveUsers } from '../lib/database.js';
const COOLDOWN_TIME = 5 * 60 * 1000;
const slutResults = [
    { text: 'trabajaste como modelo de fotografía', min: 600, max: 2000 },
    { text: 'hiciste una sesión de fotos atrevida', min: 800, max: 2500 },
    { text: 'trabajaste en un club nocturno', min: 1000, max: 3500 },
    { text: 'modelaste para una revista de moda', min: 1200, max: 3800 },
    { text: 'fuiste acompañante en un evento exclusivo', min: 1500, max: 4500 },
    { text: 'trabajaste como bailarín/a profesional', min: 900, max: 2800 },
    { text: 'hiciste una presentación privada', min: 1800, max: 5000 },
    { text: 'participaste en un desfile de moda', min: 700, max: 2200 }
];
const slutCommand = {
    name: 'slut',
    aliases: [],
    category: 'economy',
    description: 'Trabaja vendiendo tu imagen para ganar coins',
    usage: '#slut',
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
            if (user.last_slut) {
                const now = Date.now();
                const lastSlut = new Date(user.last_slut).getTime();
                const timeLeft = (lastSlut + COOLDOWN_TIME) - now;
                if (timeLeft > 0) {
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    const timeString = minutes > 0
                        ? `${minutes} minuto${minutes > 1 ? 's' : ''} y ${seconds} segundo${seconds > 1 ? 's' : ''}`
                        : `${seconds} segundo${seconds > 1 ? 's' : ''}`;
                    await sock.sendMessage(chatId, {
                        text: `ᯓ★ Tienes que esperar *${timeString}* para trabajar nuevamente.`
                    }, { quoted: msg });
                    return;
                }
            }
            const randomWork = slutResults[Math.floor(Math.random() * slutResults.length)];
            const earnedCoins = Math.floor(Math.random() * (randomWork.max - randomWork.min + 1)) + randomWork.min;
            user.coins += earnedCoins;
            user.last_slut = new Date().toISOString();
            await saveUsers(users);
            await sock.sendMessage(chatId, {
                text: `ᯓ★ ${randomWork.text} y ganaste *${earnedCoins.toLocaleString()}* Coins.`
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando slut:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al procesar el trabajo.'
            }, { quoted: msg });
        }
    }
};
export default slutCommand;