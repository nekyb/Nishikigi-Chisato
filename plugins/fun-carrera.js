const autos = [
    "🏎️ Ferrari",
    "🚗 Mustang", 
    "🚙 Jeep",
    "🚕 Taxi",
    "🚚 Camión",
    "🚓 Policía",
    "🛻 Pick-Up",
    "🚜 Tractor"
]

const carreraCommand = {
name: 'carrera',
aliases: [],
category: 'game',
description: 'Juego de carrera de autos con otros usuarios',
usage: '#carrera',
adminOnly: false,
groupOnly: true,
botAdminRequired: false,
async execute(sock, msg, args) {
const chatId = msg.key.remoteJid
if (!global.gameData) {
global.gameData = {}}
if (!global.gameData.carreras) {
global.gameData.carreras = {}}
if (global.gameData.carreras[chatId]) {
return await sock.sendMessage(chatId, {
text: '⚠️ Ya hay una carrera activa en este chat.\n\n_Espera a que termine para iniciar otra_'}, { quoted: msg })}
let mensajeInicial = `🚦 *CARRERA DE AUTOS* 🚦\n\n📌 **Elige tu auto:**\n`
autos.forEach((auto, i) => {
mensajeInicial += `🔹 ${i + 1}. ${auto}\n`})
mensajeInicial += "\n📌 *Responde con el número del auto que quieres para participar.*\n⏱️ La carrera iniciará en 10 segundos"
global.gameData.carreras[chatId] = {
jugadores: {},
activa: true,
iniciador: msg.key.participant || msg.key.remoteJid}
await sock.sendMessage(chatId, {text: mensajeInicial})
setTimeout(async () => {
if (!global.gameData.carreras[chatId]) return
const jugadores = global.gameData.carreras[chatId].jugadores
const numJugadores = Object.keys(jugadores).length
if (numJugadores < 2) {
await sock.sendMessage(chatId, {text: "❌ *No hubo suficientes jugadores para iniciar la carrera.*\n\n_Se necesitan al menos 2 jugadores_"})
} else {
const participantes = Object.values(jugadores)
const ganador = participantes[Math.floor(Math.random() * participantes.length)]
let mensajeCarrera = "🏁 *LA CARRERA COMIENZA...* 🏁\n\n"
mensajeCarrera += "🏎️ *Participantes:*\n"
participantes.forEach(({ nombre, auto }) => {
mensajeCarrera += `👤 ${nombre}: ${auto}\n`})    
mensajeCarrera += `\n🎉 *¡EL GANADOR ES:* ${ganador.nombre} con ${ganador.auto} 🏆\n\n`
mensajeCarrera += `💰 *Felicidades por tu victoria!*`
await sock.sendMessage(chatId, {
text: mensajeCarrera,
mentions: Object.keys(jugadores)})
if (global.db.data.users[ganador.id]) {
global.db.data.users[ganador.id].exp = (global.db.data.users[ganador.id].exp || 0) + 500}}
delete global.gameData.carreras[chatId]}, 10000)},
async handleResponse(sock, msg) {
const chatId = msg.key.remoteJid
const sender = msg.key.participant || msg.key.remoteJid
if (!global.gameData?.carreras?.[chatId]) return false
const texto = msg.message?.conversation || 
msg.message?.extendedTextMessage?.text
if (!texto) return false
const eleccion = parseInt(texto.trim())
if (eleccion >= 1 && eleccion <= autos.length) {
const carreraActual = global.gameData.carreras[chatId]
if (carreraActual.jugadores[sender]) {
await sock.sendMessage(chatId, {text: '⚠️ Ya has elegido tu auto para esta carrera.'}, { quoted: msg })
return true}
const autoSeleccionado = autos[eleccion - 1]
const pushName = msg.pushName || 'Usuario'
carreraActual.jugadores[sender] = {
id: sender,
nombre: pushName,
auto: autoSeleccionado}
const numJugadores = Object.keys(carreraActual.jugadores).length
await sock.sendMessage(chatId, {text: `✅ *${pushName} ha elegido:* ${autoSeleccionado}\n\n👥 Jugadores registrados: ${numJugadores}\n⌛ Esperando más jugadores...`,
mentions: [sender]})
return true}
return false}}
export default carreraCommand