import { loadUsers } from '../lib/database.js';
import { getUserId, getChatId } from '../lib/getUserId.js';

const economyboardCommand = {
    name: 'economyboard',
    aliases: ['eboard', 'baltop'],
    category: 'economy',
    description: 'Muestra el top 10 de usuarios más ricos',
    usage: '#economyboard, #eboard o #baltop',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = getChatId(msg);
        try {
            const users = await loadUsers();
            const userEntries = Object.entries(users);
            if (userEntries.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '《✿》 No hay usuarios registrados en el sistema de economía.'
                }, { quoted: msg });
                return;
            }
            const sortedUsers = userEntries
                .filter(([userId, _]) => !userId.includes('@g.us')) 
                .sort(([, a], [, b]) => {
                    const aTotal = ((a.economy?.coins || 0) + (a.economy?.bank || 0));
                    const bTotal = ((b.economy?.coins || 0) + (b.economy?.bank || 0));
                    return bTotal - aTotal;
                })
                .slice(0, 10);
            if (sortedUsers.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '《✿》 No hay usuarios registrados en el sistema de economía.'
                }, { quoted: msg });
                return;
            }
            const getMedalEmoji = (position) => {
                switch (position) {
                    case 1: return '🥇';
                    case 2: return '🥈';
                    case 3: return '🥉';
                    default: return '◆';
                }
            };
            const formatCoins = (coins) => {
                const amount = coins || 0;
                return amount.toLocaleString('es-ES');
            };
            let leaderboard = `╭───《 𝗘𝗖𝗢𝗡𝗢𝗠𝗬 𝗟𝗘𝗔𝗗𝗘𝗥𝗕𝗢𝗔𝗥𝗗 》───╮\n`;
            leaderboard += `│\n`;
            leaderboard += `│  ▸ Top ${sortedUsers.length} Usuarios Más Ricos\n`;
            leaderboard += `│  ▸ Sistema de Economía Delta\n`;
            leaderboard += `│\n`;
            leaderboard += `╰─────────────────────────╯\n\n`;
            for (let i = 0; i < sortedUsers.length; i++) {
                const [userId, userData] = sortedUsers[i];
                const position = i + 1;
                const medal = getMedalEmoji(position);
                const phoneNumber = userId.replace('@s.whatsapp.net', '');
                if (position <= 3) {
                    leaderboard += `${medal} ─────────────\n`;
                    leaderboard += `   │ 𝗣𝗼𝘀𝗶𝗰𝗶𝗼𝗻: #${position}\n`;
                    leaderboard += `   │ 𝗨𝘀𝘂𝗮𝗿𝗶𝗼: @${phoneNumber}\n`;
                    leaderboard += `   │ 𝗡𝗼𝗺𝗯𝗿𝗲: ${userData.name}\n`;
                    leaderboard += `   │ 𝗖𝗼𝗶𝗻𝘀: ${formatCoins(userData.economy?.coins || 0)} 💰\n`;
                    leaderboard += `   │ 𝗕𝗮𝗻𝗰𝗼: ${formatCoins(userData.economy?.bank || 0)} 🏦\n`;
                    leaderboard += `   │ 𝗧𝗼𝘁𝗮𝗹: ${formatCoins((userData.economy?.coins || 0) + (userData.economy?.bank || 0))} 💎\n`;
                    leaderboard += `   ─────────────\n\n`;
                }
                else {
                    leaderboard += `${medal} ${position}. @${phoneNumber}\n`;
                    leaderboard += `   ├─ ${userData.name}\n`;
                    leaderboard += `   ├─ ✦ ${formatCoins(userData.economy?.coins || 0)} Coins\n`;
                    leaderboard += `   ├─ ✦ ${formatCoins(userData.economy?.bank || 0)} Bank\n`;
                    leaderboard += `   └─ ✦ ${formatCoins((userData.economy?.coins || 0) + (userData.economy?.bank || 0))} Total\n\n`;
                }
            }
            leaderboard += `╭─────────────────────────╮\n`;
            leaderboard += `│  ☪︎ 𝓟𝓸𝔀𝓮𝓻𝓮𝓭 𝓑𝔂 𝓓𝓮𝓵𝓽𝓪𝓑𝔂𝓽𝓮\n`;
            leaderboard += `╰─────────────────────────╯`;
            const mentions = sortedUsers.map(([userId]) => userId);
            await sock.sendMessage(chatId, {
                text: leaderboard,
                mentions: mentions
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en comando economyboard:', error);
            await sock.sendMessage(chatId, {
                text: '《✿》 Error al cargar el leaderboard de economía.'
            }, { quoted: msg });
        }
    }
};
export default economyboardCommand;