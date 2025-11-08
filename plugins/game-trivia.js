import axios from 'axios';

const activeTrivias = new Map();
const userScores = new Map();

export default {
    name: 'trivia',
    aliases: ['pregunta', 'quiz'],
    category: 'games',
    description: 'Juego de preguntas y respuestas con puntaje',
    usage: '#trivia [categoría] o #trivia score',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;
        
        try {
            if (args[0] === 'score' || args[0] === 'puntaje') {
                const score = userScores.get(userId) || 0;
                const ranking = Array.from(userScores.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);

                let rankText = '🏆 *Top 10 Jugadores*\n\n';
                ranking.forEach(([user, points], index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    rankText += `${medal} ${points} puntos\n`;
                });

                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Trivia - Tu Puntaje*\n\n` +
                        `🎯 Tus puntos: ${score}\n\n` +
                        `${rankText}`
                });
            }

            if (activeTrivias.has(chatId)) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ⚠️ Ya hay una trivia activa en este chat.\n\n' +
                        'Responde la pregunta actual primero.'
                });
            }

            await sock.sendMessage(chatId, {
                text: '《✧》 🎮 Cargando pregunta de trivia...'
            });

            const categories = {
                'ciencia': 17,
                'computacion': 18,
                'matematicas': 19,
                'deportes': 21,
                'historia': 23,
                'geografia': 22,
                'arte': 25,
                'animales': 27,
                'general': 9
            };

            const category = args[0] ? categories[args[0].toLowerCase()] || 9 : 9;

            const response = await axios.get(`https://opentdb.com/api.php?amount=1&category=${category}&type=multiple&encode=base64`);
            
            if (!response.data.results || response.data.results.length === 0) {
                throw new Error('No se pudo obtener una pregunta');
            }

            const trivia = response.data.results[0];
            const question = Buffer.from(trivia.question, 'base64').toString('utf-8');
            const correctAnswer = Buffer.from(trivia.correct_answer, 'base64').toString('utf-8');
            const incorrectAnswers = trivia.incorrect_answers.map(a => 
                Buffer.from(a, 'base64').toString('utf-8')
            );

            const allAnswers = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5);

            activeTrivias.set(chatId, {
                correctAnswer: correctAnswer.toLowerCase(),
                timestamp: Date.now(),
                userId: userId
            });

            const categoryName = Object.keys(categories).find(key => categories[key] === category) || 'general';
            const difficulty = Buffer.from(trivia.difficulty, 'base64').toString('utf-8');
            
            await sock.sendMessage(chatId, {
                text: `《✧》 *Trivia Quiz*\n\n` +
                    `📚 Categoría: ${categoryName}\n` +
                    `⭐ Dificultad: ${difficulty}\n\n` +
                    `❓ *Pregunta:*\n${question}\n\n` +
                    `*Opciones:*\n` +
                    allAnswers.map((a, i) => `${String.fromCharCode(65 + i)}) ${a}`).join('\n') + '\n\n' +
                    `⏱️ Tienes 30 segundos para responder\n` +
                    `💡 Responde con la letra (A, B, C, D) o el texto completo`
            }, { quoted: msg });

            setTimeout(() => {
                if (activeTrivias.has(chatId)) {
                    activeTrivias.delete(chatId);
                    sock.sendMessage(chatId, {
                        text: `《✧》 ⏰ Se acabó el tiempo!\n\n` +
                            `La respuesta correcta era: *${correctAnswer}*`
                    });
                }
            }, 30000);

        } catch (error) {
            console.error('Error en trivia:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al cargar trivia.\n\n` +
                    `Categorías disponibles: ciencia, computacion, matematicas, deportes, historia, geografia, arte, animales, general`
            });
        }
    },

    async handleAnswer(sock, msg, answer) {
        const chatId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;

        if (!activeTrivias.has(chatId)) return false;

        const trivia = activeTrivias.get(chatId);
        const userAnswer = answer.toLowerCase().trim();

        if (userAnswer === trivia.correctAnswer || 
            ['a', 'b', 'c', 'd'].includes(userAnswer)) {
            
            const timeTaken = Date.now() - trivia.timestamp;
            const points = Math.max(1, Math.floor(30 - timeTaken / 1000));

            if (!userScores.has(userId)) {
                userScores.set(userId, 0);
            }
            userScores.set(userId, userScores.get(userId) + points);

            activeTrivias.delete(chatId);

            await sock.sendMessage(chatId, {
                text: `《✧》 ✅ *¡Correcto!*\n\n` +
                    `🎯 +${points} puntos\n` +
                    `⏱️ Tiempo: ${(timeTaken / 1000).toFixed(1)}s\n` +
                    `📊 Puntaje total: ${userScores.get(userId)}\n\n` +
                    `Usa #trivia para otra pregunta`
            }, { quoted: msg });

            return true;
        }

        return false;
    }
};
