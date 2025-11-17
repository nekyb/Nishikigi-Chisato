import { getUser, updateUser } from '../database/users.js';

const bankCommand = {
    name: 'bank',
    aliases: ['banco', 'depositar', 'retirar'],
    category: 'economy',
    description: 'Gestiona tu dinero en el banco',
    usage: '#bank <depositar/retirar> <cantidad>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const userId = msg.key.participant || msg.key.remoteJid;
        const chatId = msg.key.remoteJid;

        if (args.length < 2) {
            return await sock.sendMessage(chatId, {
                text: `❌ Uso correcto: #bank <depositar/retirar> <cantidad>\n\n📌 Ejemplo:\n#bank depositar 1000\n#bank retirar 500\n\n💡 También puedes usar:\n#banco, #depositar, #retirar`
            }, { quoted: msg });
        }

        const action = args[0].toLowerCase();
        const amount = parseInt(args[1]);

        if (isNaN(amount) || amount <= 0) {
            return await sock.sendMessage(chatId, {
                text: '❌ La cantidad debe ser un número positivo.'
            }, { quoted: msg });
        }

        try {
            const user = await getUser(userId.split('@')[0]);
            if (!user) {
                return await sock.sendMessage(chatId, {
                    text: '❌ No estás registrado en el sistema.'
                }, { quoted: msg });
            }

            if (!user.economy) {
                user.economy = {
                    coins: 0,
                    bank: 0,
                    last_daily: null,
                    last_work: null,
                    inventory: [],
                    stats: {
                        commands_used: 0,
                        messages_sent: 0,
                        items_bought: 0,
                        items_sold: 0
                    }
                };
            }

            if (action === 'depositar' || action === 'dep') {
                if (user.economy.coins < amount) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ No tienes suficientes coins para depositar.\n\n💰 Coins actuales: ${user.economy.coins}`
                    }, { quoted: msg });
                }

                user.economy.coins -= amount;
                user.economy.bank = (user.economy.bank || 0) + amount;

                await updateUser(user.user_id, user);

                return await sock.sendMessage(chatId, {
                    text: `✅ Has depositado ${amount} coins en el banco.\n\n💰 Coins: ${user.economy.coins}\n🏦 Banco: ${user.economy.bank}\n💎 Total: ${user.economy.coins + user.economy.bank}`
                }, { quoted: msg });
            }
            else if (action === 'retirar' || action === 'ret') {
                if ((user.economy.bank || 0) < amount) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ No tienes suficiente dinero en el banco.\n\n🏦 Saldo en banco: ${user.economy.bank || 0}`
                    }, { quoted: msg });
                }

                user.economy.bank -= amount;
                user.economy.coins = (user.economy.coins || 0) + amount;

                await updateUser(user.user_id, user);

                return await sock.sendMessage(chatId, {
                    text: `✅ Has retirado ${amount} coins del banco.\n\n💰 Coins: ${user.economy.coins}\n🏦 Banco: ${user.economy.bank}\n💎 Total: ${user.economy.coins + user.economy.bank}`
                }, { quoted: msg });
            }
            else {
                return await sock.sendMessage(chatId, {
                    text: '❌ Acción inválida. Usa "depositar" o "retirar".'
                }, { quoted: msg });
            }
        } catch (error) {
            console.error('Error en comando bank:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Ocurrió un error al procesar tu transacción.'
            }, { quoted: msg });
        }
    }
};

export default bankCommand;