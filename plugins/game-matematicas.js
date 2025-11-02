const modes = {
    noob: [-3, 3, -3, 3, '+-', 15000, 10],
    easy: [-10, 10, -10, 10, '*/+-', 20000, 40],
    medium: [-40, 40, -20, 20, '*/+-', 40000, 150],
    hard: [-100, 100, -70, 70, '*/+-', 60000, 350],
    extreme: [-999999, 999999, -999999, 999999, '*/', 99999, 9999],
    impossible: [-99999999999, 99999999999, -99999999999, 999999999999, '*/', 30000, 35000],
    impossible2: [-999999999999999, 999999999999999, -999, 999, '/', 30000, 50000],
}

const operators = {
    '+': '+',
    '-': '-',
    '*': '×',
    '/': '÷',
}

function randomInt(from, to) {
    if (from > to) [from, to] = [to, from]
    from = Math.floor(from)
    to = Math.floor(to)
    return Math.floor((to - from) * Math.random() + from)}
function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]}
function genMath(mode) {
    const [a1, a2, b1, b2, ops, time, bonus] = modes[mode]
    let a = randomInt(a1, a2)
    const b = randomInt(b1, b2)
    const op = pickRandom([...ops])
    let result = (new Function(`return ${a} ${op.replace('/', '*')} ${b < 0 ? `(${b})` : b}`))()
    if (op == '/') [a, result] = [result, a]
    return {
        str: `${a} ${operators[op]} ${b}`,
        mode,
        time,
        bonus,
        result: Math.round(result * 100) / 100,}}

const mathCommand = {
    name: 'math',
    aliases: ['mates', 'matemáticas'],
    category: 'game',
    description: 'Juego de matemáticas con diferentes niveles de dificultad',
    usage: '#math <modo>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        if (!global.gameData) {
            global.gameData = {}}
        if (!global.gameData.math) {
            global.gameData.math = {}}
        if (args.length < 1) {
            const helpMessage = `🧮 *JUEGO DE MATEMÁTICAS* 🧮

📝 Uso: #math <modo>

🎯 Modos disponibles:
${Object.keys(modes).map(m => `• ${m}`).join('\n')}

_Ejemplo: #math medium_`
            return await sock.sendMessage(chatId, {
                text: helpMessage
            }, { quoted: msg })}
        const mode = args[0].toLowerCase()
        if (!(mode in modes)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Modo inválido. Usa uno de estos:\n${Object.keys(modes).join(' | ')}`
            }, { quoted: msg })}
        if (global.gameData.math[chatId]) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Ya hay un juego de matemáticas activo en este chat.\n\n_Responde la pregunta actual primero_'
            }, { quoted: global.gameData.math[chatId].message })}
        
        const mathProblem = genMath(mode)
        const questionText = `🧮 *MATEMÁTICAS - ${mode.toUpperCase()}* 🧮
❓ Resuelve:
*${mathProblem.str} = ?*

⏱️ Tiempo: ${(mathProblem.time / 1000).toFixed(0)} segundos
💰 Recompensa: +${mathProblem.bonus} XP

_Responde con el resultado_`

        const sentMsg = await sock.sendMessage(chatId, {
            text: questionText
        }, { quoted: msg })
        global.gameData.math[chatId] = {
            message: sentMsg,
            answer: mathProblem.result,
            bonus: mathProblem.bonus,
            mode: mode,
            timeout: setTimeout(async () => {
                if (global.gameData.math[chatId]) {
                    await sock.sendMessage(chatId, {
                        text: `⏰ ¡Se acabó el tiempo!\n\n✅ La respuesta correcta era: *${mathProblem.result}*\n\n_Puedes intentar de nuevo con #math ${mode}_`
                    }, { quoted: sentMsg })
                    delete global.gameData.math[chatId]}}, mathProblem.time)}},

    async checkAnswer(sock, msg) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        if (!global.gameData?.math?.[chatId]) return false
        const gameSession = global.gameData.math[chatId]
        const userAnswer = msg.message?.conversation?.trim() || 
                          msg.message?.extendedTextMessage?.text?.trim()
        if (!userAnswer) return false
        const numericAnswer = parseFloat(userAnswer)
        if (isNaN(numericAnswer)) return false
        const isCorrect = Math.abs(numericAnswer - gameSession.answer) < 0.01
        if (isCorrect) {
            clearTimeout(gameSession.timeout)
            if (!global.db.data.users[sender]) {
                global.db.data.users[sender] = { exp: 0 }}
            global.db.data.users[sender].exp = (global.db.data.users[sender].exp || 0) + gameSession.bonus
            await sock.sendMessage(chatId, {
                text: `🎉 ¡Correcto, @${sender.split('@')[0]}!\n\n✅ Respuesta: *${gameSession.answer}*\n💰 Has ganado +${gameSession.bonus} XP\n\n_Prueba otro modo con #math ${gameSession.mode}_`,
                mentions: [sender]
            }, { quoted: gameSession.message })
            delete global.gameData.math[chatId]
            return true}
        return false}}
export default mathCommand