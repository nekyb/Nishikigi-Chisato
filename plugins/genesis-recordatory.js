import axios from 'axios'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const recordatoriesPath = join(__dirname, '../database/recordatories.json')
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB147GA8T_Yw3YMChXocBL0W4qvIFYGw6o'
const countryTimezones = {
    '1': 'America/New_York',
    '52': 'America/Mexico_City',
    '53': 'America/Havana',
    '54': 'America/Argentina/Buenos_Aires',
    '55': 'America/Sao_Paulo',
    '56': 'America/Santiago',
    '57': 'America/Bogota',
    '58': 'America/Caracas',
    '591': 'America/La_Paz',
    '593': 'America/Guayaquil',
    '595': 'America/Asuncion',
    '598': 'America/Montevideo',
    '34': 'Europe/Madrid',
    '33': 'Europe/Paris',
    '39': 'Europe/Rome',
    '44': 'Europe/London',
    '49': 'Europe/Berlin',
    '351': 'Europe/Lisbon',
    '61': 'Australia/Sydney',
    '81': 'Asia/Tokyo',
    '82': 'Asia/Seoul',
    '86': 'Asia/Shanghai',
    '91': 'Asia/Kolkata',
    '20': 'Africa/Cairo',
    '27': 'Africa/Johannesburg',
    '234': 'Africa/Lagos',
    '7': 'Europe/Moscow',
    '380': 'Europe/Kiev',
    '48': 'Europe/Warsaw',
    '420': 'Europe/Prague',
    '36': 'Europe/Budapest'
}

async function loadRecordatories() {
    try {const data = await fs.readFile(recordatoriesPath, 'utf-8')
        return JSON.parse(data)} catch {return []}}
async function saveRecordatories(recordatories) {
    await fs.writeFile(recordatoriesPath, JSON.stringify(recordatories, null, 2))}
function getCountryCode(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '')
    for (const code of Object.keys(countryTimezones).sort((a, b) => b.length - a.length)) {
        if (cleaned.startsWith(code)) {return code}}
    return '1'}
function getTimezone(phoneNumber) {
    const countryCode = getCountryCode(phoneNumber)
    return countryTimezones[countryCode] || 'America/New_York'}
function parseDateTime(dateStr, timeStr, timezone) {
    const [day, month, year] = dateStr.split('/').map(Number)
    const [hours, minutes] = timeStr.split(':').map(Number)
    const dateUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes))
    const timezoneOffset = getTimezoneOffset(timezone)
    dateUTC.setHours(dateUTC.getHours() - timezoneOffset)
    return dateUTC}
function getTimezoneOffset(timezone) {
    const offsetMap = {
        'America/New_York': -5,
        'America/Mexico_City': -6,
        'America/Bogota': -5,
        'America/Santiago': -4,
        'America/Sao_Paulo': -3,
        'America/Argentina/Buenos_Aires': -3,
        'Europe/Madrid': 1,
        'Europe/London': 0,
        'Asia/Tokyo': 9,
        'Australia/Sydney': 10,
        'Asia/Shanghai': 8}
    return offsetMap[timezone] || 0}

async function generateReminderMessage(reminderText, userName) {
    try {
        const prompt = `Eres un asistente personal amigable y cálido. Genera un mensaje de recordatorio personalizado y natural para ${userName}. 

El recordatorio es: "${reminderText}"

Requisitos:
- Hazlo sonar muy humano y personal
- Usa emojis apropiados (máximo 3)
- Sé breve pero cálido (máximo 2 líneas)
- No uses formato de lista
- Varía el saludo cada vez (Hola, Hey, Qué tal, etc)

Ejemplo de estilo:
"Hey ${userName}! 🌟 Solo paso a recordarte que ${reminderText}. ¡No lo olvides!"

Genera un mensaje único y diferente:`
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 150
                }
            },
            {
                headers: { 'Content-Type': 'application/json' }})
        const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text
        return generatedText || `Hola ${userName}! 🔔 Te recuerdo: ${reminderText}`} 
        catch (error) {return `Hola ${userName}! 🔔 Te recuerdo: ${reminderText}`}}

const recordatoryCommand = {
    name: 'recordatory',
    aliases: ['reminder', 'recordar', 'remindme'],
    category: 'ai',
    description: 'Crea recordatorios inteligentes con IA que se ajustan a tu zona horaria',
    usage: '#recordatory <día> <hora> <texto>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        const userName = msg.pushName || 'Usuario'
        if (args.length < 3) {
            const helpText = `🧠 *Genesis Recordatory's*

Crea recordatorios que se ajustan automáticamente a tu zona horaria.

*Uso:*
#recordatory <día> <hora> <texto>

*Ejemplos:*
• #recordatory 15/12/2024 14:30 reunión con el equipo
• #recordatory 1/1/2025 00:00 ¡Feliz año nuevo!
• #recordatory 25/12/2024 20:00 cena navideña

*Formatos:*
📅 Día: DD/MM/YYYY (Ej: 31/12/2024)
⏰ Hora: HH:MM formato 24h (Ej: 14:30)

> _*Creado por Soblend Development Studio Creative, Inc.*_`
            return await sock.sendMessage(chatId, {
                text: helpText
            }, { quoted: msg })}
        const dateStr = args[0]
        const timeStr = args[1]
        const reminderText = args.slice(2).join(' ')
        if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            return await sock.sendMessage(chatId, {
                text: '❌ Formato de fecha incorrecto. Usa: DD/MM/YYYY\n\n*Ejemplo:* 25/12/2024'
            }, { quoted: msg })}
        if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
            return await sock.sendMessage(chatId, {text: '❌ Formato de hora incorrecto. Usa: HH:MM\n\n*Ejemplo:* 14:30'}, { quoted: msg })}
        try {const timezone = getTimezone(sender)
            const reminderDate = parseDateTime(dateStr, timeStr, timezone)
            const now = new Date()
            if (reminderDate <= now) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ La fecha y hora deben ser futuras.\n\nRevisa que hayas ingresado correctamente la fecha.'
                }, { quoted: msg })}
            const recordatories = await loadRecordatories()
            const newRecordatory = {
                id: Date.now().toString(),
                userId: sender,
                userName: userName,
                chatId: chatId,
                reminderText: reminderText,
                scheduledTime: reminderDate.toISOString(),
                timezone: timezone,
                created: new Date().toISOString(),
                sent: false}
            recordatories.push(newRecordatory)
            await saveRecordatories(recordatories)
            const timeUntil = Math.floor((reminderDate - now) / 1000 / 60)
            const hoursUntil = Math.floor(timeUntil / 60)
            const daysUntil = Math.floor(hoursUntil / 24)
             let timeMessage = ''
            if (daysUntil > 0) {
                timeMessage = `${daysUntil} día${daysUntil > 1 ? 's' : ''}`
            } else if (hoursUntil > 0) {
                timeMessage = `${hoursUntil} hora${hoursUntil > 1 ? 's' : ''}`
            } else {
                timeMessage = `${timeUntil} minuto${timeUntil > 1 ? 's' : ''}`
            }
            
            const confirmText = `✅ *Recordatorio creado exitosamente*
Te recordaré en ${timeMessage}

📅 *Fecha:* ${dateStr}
⏰ *Hora:* ${timeStr}
🌍 *Zona horaria:* ${timezone.split('/')[1].replace('_', ' ')}
📝 *Recordatorio:* ${reminderText}

_Te enviaré un mensaje personalizado cuando llegue el momento_ 
> _*Creado por Soblend | Development Studio Creative, Inc.*_`

            await sock.sendMessage(chatId, {
                text: confirmText}, { quoted: msg })
            await sock.sendMessage(chatId, {
                react: {
                    text: '⏰',
                    key: msg.key}
            })} catch (error) {console.error('Error creando recordatorio:', error)
        await sock.sendMessage(chatId, {text: '❌ Error al crear el recordatorio. Verifica el formato e intenta nuevamente.'}, { quoted: msg })}}}

async function checkReminders(sock) {
    try {const recordatories = await loadRecordatories()
        const now = new Date()
        let updated = false
        for (const recordatory of recordatories) {
            if (recordatory.sent) continue
            const scheduledTime = new Date(recordatory.scheduledTime)
            if (now >= scheduledTime) {
                const aiMessage = await generateReminderMessage(
                    recordatory.reminderText,
                    recordatory.userName)
                await sock.sendMessage(recordatory.chatId, {
                    text: aiMessage,
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363421377964290@newsletter",
                            newsletterName: "🧠 Recordatorios IA",
                            serverMessageId: 1}}})
                recordatory.sent = true
                recordatory.sentAt = now.toISOString()
                updated = true}}
        if (updated) {const activeRecordatories = recordatories.filter(r => !r.sent || (new Date() - new Date(r.sentAt)) < 86400000)
             await saveRecordatories(activeRecordatories)}} 
        catch (error) {console.error('Error verificando recordatorios:', error)}}
if (!global.reminderInterval) {global.reminderInterval = setInterval(() => {if (global.sock) {checkReminders(global.sock)}}, 30000)}
export default recordatoryCommand