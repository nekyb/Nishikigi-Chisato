import { loadUsers, saveUsers } from '../lib/database.js';
import { getUserId, getChatId } from '../lib/getUserId.js';
const COOLDOWN_TIME = 8 * 60 * 1000;
const crimeResults = [
    {
        success: true,
        text: 'robaste una tienda de conveniencia',
        min: 800,
        max: 2500
    },
    {
        success: true,
        text: 'hackeaste un cajero automático',
        min: 1500,
        max: 4000
    },
    {
        success: true,
        text: 'asaltaste un banco pequeño',
        min: 3000,
        max: 7000
    },
    {
        success: true,
        text: 'estafaste a un millonario',
        min: 2000,
        max: 5500
    },
    {
        success: false,
        text: 'intentaste robar una joyería pero te atraparon',
        min: 500,
        max: 2000
    },
    {
        success: false,
        text: 'intentaste hackear un banco pero fallaste',
        min: 800,
        max: 2500
    },
    {
        success: false,
        text: 'la policía te atrapó robando una casa',
        min: 1000,
        max: 3000
    },
    {
        success: true,
        text: 'vendiste información clasificada',
        min: 1800,
        max: 4500
    },
    {
        success: false,
        text: 'te descubrieron falsificando billetes',
        min: 600,
        max: 1800
    }
];
const crimeCommand = {
    name: 'crime',
    aliases: ['crimen'],
    category: 'economy',
    description: 'Comete un crimen para ganar o perder coins',
    usage: '#crime o #crimen',
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
            if (user.last_crime) {
                const now = Date.now();
                const lastCrime = new Date(user.last_crime).getTime();
                const timeLeft = (lastCrime + COOLDOWN_TIME) - now;
                if (timeLeft > 0) {
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    const timeString = minutes > 0
                        ? `${minutes} minuto${minutes > 1 ? 's' : ''} y ${seconds} segundo${seconds > 1 ? 's' : ''}`
                        : `${seconds} segundo${seconds > 1 ? 's' : ''}`;
                    await sock.sendMessage(chatId, {
                        text: `ᯓ★ Tienes que esperar *${timeString}* para cometer otro crimen.`
                    }, { quoted: msg });
                    return;
                }
            }
            const randomCrime = crimeResults[Math.floor(Math.random() * crimeResults.length)];
            const amount = Math.floor(Math.random() * (randomCrime.max - randomCrime.min + 1)) + randomCrime.min;
            if (randomCrime.success) {
                user.coins += amount;
            }
            else {
                user.coins = Math.max(0, user.coins - amount);
            }
            user.last_crime = new Date().toISOString();
            await saveUsers(users);
            const resultText = randomCrime.success
                ? `ᯓ★ ¡Éxito! ${randomCrime.text} y ganaste *${amount.toLocaleString()}* Coins.`
                : `ᯓ★ ¡Fracaso! ${randomCrime.text} y perdiste *${amount.toLocaleString()}* Coins.`;
            await sock.sendMessage(chatId, {
                text: resultText
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando crime:', error);
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al cometer el crimen.'
            }, { quoted: msg });
        }
    }
};
export default crimeCommand;