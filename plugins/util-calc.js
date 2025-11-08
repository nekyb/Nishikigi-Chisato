export default {
    name: 'calc',
    aliases: ['calculate', 'calculadora', 'math'],
    category: 'utils',
    description: 'Calculadora científica avanzada',
    usage: '#calc [expresión matemática]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Calculadora Científica*\n\n` +
                        `Uso: #calc [expresión]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #calc 2 + 2\n` +
                        `✿ #calc 5 * (3 + 2)\n` +
                        `✿ #calc sqrt(16)\n` +
                        `✿ #calc pow(2, 3)\n` +
                        `✿ #calc sin(30)\n` +
                        `✿ #calc pi * 2\n\n` +
                        `Funciones disponibles:\n` +
                        `• Operaciones: +, -, *, /, %, ^\n` +
                        `• Funciones: sqrt, pow, sin, cos, tan, log, exp\n` +
                        `• Constantes: pi, e`
                });
            }

            const expression = args.join(' ')
                .replace(/x/gi, '*')
                .replace(/÷/g, '/')
                .replace(/π/g, 'Math.PI')
                .replace(/pi/gi, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/sqrt\(/gi, 'Math.sqrt(')
                .replace(/pow\(/gi, 'Math.pow(')
                .replace(/sin\(/gi, 'Math.sin(')
                .replace(/cos\(/gi, 'Math.cos(')
                .replace(/tan\(/gi, 'Math.tan(')
                .replace(/log\(/gi, 'Math.log(')
                .replace(/exp\(/gi, 'Math.exp(')
                .replace(/abs\(/gi, 'Math.abs(')
                .replace(/floor\(/gi, 'Math.floor(')
                .replace(/ceil\(/gi, 'Math.ceil(')
                .replace(/round\(/gi, 'Math.round(')
                .replace(/\^/g, '**');

            const sanitized = expression.replace(/[^0-9+\-*/().%\sMath]/g, '');

            if (sanitized.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ Expresión inválida'
                });
            }

            try {
                const result = eval(sanitized);

                if (result === Infinity || result === -Infinity) {
                    return await sock.sendMessage(chatId, {
                        text: '《✧》 ⚠️ Resultado: Infinito'
                    });
                }

                if (isNaN(result)) {
                    return await sock.sendMessage(chatId, {
                        text: '《✧》 ❌ Resultado inválido (NaN)'
                    });
                }

                await sock.sendMessage(chatId, {
                    text: `《✧》 *Calculadora*\n\n` +
                        `📝 *Expresión:*\n${args.join(' ')}\n\n` +
                        `📊 *Resultado:*\n${result}\n\n` +
                        `${typeof result === 'number' && result.toString().length > 10 ? 
                            `🔬 *Científico:* ${result.toExponential(5)}` : ''}`
                }, { quoted: msg });

            } catch (evalError) {
                await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ Error al evaluar la expresión.\n\n` +
                        `Verifica la sintaxis y vuelve a intentar.`
                });
            }

        } catch (error) {
            console.error('Error en calc:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error en la calculadora.\n\n` +
                    `Detalles: ${error.message}`
            });
        }
    }
};
