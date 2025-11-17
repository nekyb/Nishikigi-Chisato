import { loadUsers, saveUsers } from '../lib/database.js';
import { getUserId, getChatId } from '../lib/getUserId.js';
const BASE_REWARD = 10000;
const STREAK_BONUS = 10000;
const COOLDOWN_TIME = 24 * 60 * 60 * 1000;
const dailyCommand = {
    name: 'daily',
    aliases: ['diario'],
    category: 'economy',
    description: 'Reclama tu recompensa diaria',
    usage: '#daily o #diario',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = getChatId(msg);
        const userId = getUserId(msg);
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
            const now = Date.now();
            const lastDaily = user.last_daily ? new Date(user.last_daily).getTime() : 0;
            const timeSinceLastClaim = now - lastDaily;
            if (timeSinceLastClaim < COOLDOWN_TIME) {
                const timeLeft = COOLDOWN_TIME - timeSinceLastClaim;
                const hours = Math.floor(timeLeft / 3600000);
                const minutes = Math.floor((timeLeft % 3600000) / 60000);
                const timeString = hours > 0
                    ? `${hours} hora${hours > 1 ? 's' : ''} y ${minutes} minuto${minutes > 1 ? 's' : ''}`
                    : `${minutes} minuto${minutes > 1 ? 's' : ''}`;
                await sock.sendMessage(chatId, {
                    text: `ᯓ★ Ya has reclamado tu recompensa diaria. Vuelve en *${timeString}*.`
                }, { quoted: msg });
                return;
            }
            const keepStreak = timeSinceLastClaim <= (COOLDOWN_TIME * 2);
            const currentStreak = user.daily_streak || 0;
            const newStreak = keepStreak ? currentStreak + 1 : 1;
            const reward = BASE_REWARD + (STREAK_BONUS * (newStreak - 1));
            user.coins += reward;
            user.last_daily = new Date().toISOString();
            user.daily_streak = newStreak;
            await saveUsers(users);
            await sock.sendMessage(chatId, {
                text: `ᯓ★ Has reclamado tu recompensa diaria de *${reward.toLocaleString()}* Coins.\n` +
                    `★ Racha actual: *${newStreak}* día${newStreak > 1 ? 's' : ''}`
            }, { quoted: msg });
        }
        catch (error) {
            console.error('Error en comando daily:', error);
            await sock.sendMessage(chatId, {
                text: '《✿》 Error al procesar la recompensa diaria.'
            }, { quoted: msg });
        }
    }
};
export default dailyCommand;