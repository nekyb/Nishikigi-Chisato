export default {
    name: 'roulette',
    aliases: ['ruleta', 'spin'],
    category: 'games',
    description: 'Ruleta de la suerte con premios aleatorios',
    usage: '#roulette',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            const prizes = [
                { emoji: '💎', name: 'Diamante', rarity: 'Legendario', value: 1000 },
                { emoji: '👑', name: 'Corona Real', rarity: 'Épico', value: 500 },
                { emoji: '🎁', name: 'Regalo Especial', rarity: 'Raro', value: 250 },
                { emoji: '⭐', name: 'Estrella de la Suerte', rarity: 'Raro', value: 200 },
                { emoji: '🍀', name: 'Trébol de 4 Hojas', rarity: 'Poco común', value: 150 },
                { emoji: '🎪', name: 'Ticket de Circo', rarity: 'Poco común', value: 100 },
                { emoji: '🎨', name: 'Paleta de Colores', rarity: 'Común', value: 75 },
                { emoji: '🎭', name: 'Máscara Teatral', rarity: 'Común', value: 50 },
                { emoji: '🎯', name: 'Diana Perfecta', rarity: 'Común', value: 40 },
                { emoji: '🎲', name: 'Dado de la Suerte', rarity: 'Común', value: 25 },
                { emoji: '🃏', name: 'Carta Comodín', rarity: 'Común', value: 20 },
                { emoji: '💫', name: 'Polvo de Estrellas', rarity: 'Común', value: 10 }
            ];

            const spinAnimation = ['🎰', '🎡', '🔮', '✨'];
            
            await sock.sendMessage(chatId, {
                text: '《✧》 🎰 *Ruleta de la Suerte*\n\nGirando la ruleta...'
            });

            let animationText = '《✧》 🎰 Girando: ';
            for (let i = 0; i < 3; i++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                animationText += spinAnimation[i % spinAnimation.length];
            }

            const prize = prizes[Math.floor(Math.random() * prizes.length)];
            
            const rarityEmoji = {
                'Legendario': '🌟',
                'Épico': '💜',
                'Raro': '💙',
                'Poco común': '💚',
                'Común': '⚪'
            };

            await sock.sendMessage(chatId, {
                text: `《✧》 🎰 *Resultado de la Ruleta*\n\n` +
                    `${prize.emoji} *${prize.name}*\n\n` +
                    `${rarityEmoji[prize.rarity]} *Rareza:* ${prize.rarity}\n` +
                    `💰 *Valor:* ${prize.value} monedas\n\n` +
                    `${prize.rarity === 'Legendario' ? '🎉 ¡FELICIDADES! Premio legendario!' : 
                      prize.rarity === 'Épico' ? '✨ ¡Excelente! Premio épico!' :
                      prize.rarity === 'Raro' ? '👏 ¡Bien hecho! Premio raro!' :
                      '👍 ¡No está mal!'}\n\n` +
                    `_Gira de nuevo para intentar conseguir un premio mejor_`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en roulette:', error);
            await sock.sendMessage(chatId, {
                text: '《✿》Error en la ruleta.'
            });
        }
    }
};
