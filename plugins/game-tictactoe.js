import TicTacToe from '../lib/tictactoe.js'

const tictactoeCommand = {
    name: 'tictactoe',
    aliases: ['ttc', 'ttt', 'xo'],
    category: 'game',
    description: 'Juega tres en raya con otro usuario',
    usage: '#tictactoe <nombre de sala>',
    adminOnly: false,
    groupOnly: true,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        if (!global.gameData) {
            global.gameData = {}}
        if (!global.gameData.tictactoe) {
            global.gameData.tictactoe = {}}
        const activeGame = Object.values(global.gameData.tictactoe).find((room) => room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(sender))
        if (activeGame) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Ya estás en una partida activa de Tres en Raya.\n\n_Termina tu partida actual primero o usa #delttt para salir_'
            }, { quoted: msg })}
        const roomName = args.join(' ').trim()
        if (!roomName) {
            return await sock.sendMessage(chatId, {
                text: '❌ Debes especificar un nombre para la sala.\n\n*Ejemplo:* #tictactoe sala1'
            }, { quoted: msg })}
        let room = Object.values(global.gameData.tictactoe).find((r) => 
            r.state === 'WAITING' && r.name === roomName)
        if (room) {
            await sock.sendMessage(chatId, {
                text: '✅ Te has unido a la partida!'
            }, { quoted: msg })
            room.o = chatId
            room.game.playerO = sender
            room.state = 'PLAYING'
            const arr = room.game.render().map((v) => {
                return {
                    X: '❎',
                    O: '⭕',
                    1: '1️⃣',
                    2: '2️⃣',
                    3: '3️⃣',
                    4: '4️⃣',
                    5: '5️⃣',
                    6: '6️⃣',
                    7: '7️⃣',
                    8: '8️⃣',
                    9: '9️⃣',
                }[v]
            })
            
            const boardText = `
🎮 *TRES EN RAYA* 🎮

❎ = @${room.game.playerX.split('@')[0]}
⭕ = @${room.game.playerO.split('@')[0]}

     ${arr.slice(0, 3).join('')}
     ${arr.slice(3, 6).join('')}
     ${arr.slice(6).join('')}

🎯 Turno de: @${room.game.currentTurn.split('@')[0]}

_Usa los números del 1-9 para jugar_
`.trim()
            const mentions = [room.game.playerX, room.game.playerO, room.game.currentTurn]
            if (room.x !== room.o) {
                await sock.sendMessage(room.x, {
                    text: boardText,
                    mentions: mentions})}
            await sock.sendMessage(room.o, {
                text: boardText,
                mentions: mentions
            }, { quoted: msg })
        } else {
            room = {
                id: 'tictactoe-' + Date.now(),
                x: chatId,
                o: '',
                game: new TicTacToe(sender, 'o'),
                state: 'WAITING',
                name: roomName}
            await sock.sendMessage(chatId, {
                text: `🎮 *TRES EN RAYA* 🎮\n\n⏳ Esperando al segundo jugador...\n\n📝 Sala: *${roomName}*\n👤 Creador: @${sender.split('@')[0]}\n\n_Para unirse usa:_ #tictactoe ${roomName}\n_Para cancelar usa:_ #delttt`,
                mentions: [sender]
            }, { quoted: msg })
        global.gameData.tictactoe[room.id] = room}}}
export default tictactoeCommand