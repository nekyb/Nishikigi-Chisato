import axios from 'axios'

const WEATHER_CACHE = new Map()
const CACHE_DURATION = 300000

async function getWeather(city) {
    const cacheKey = city.toLowerCase()
    const cached = WEATHER_CACHE.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {return cached.data}
    try {const response = await axios.get('https://wttr.in/' + encodeURIComponent(city), {
            params: {
                format: 'j1'}})
        WEATHER_CACHE.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()})

        return response.data
    } catch (error) {
        console.error('Error fetching weather:', error)
        return null
    }
}

function getWeatherEmoji(code) {
    const weatherCodes = {
        '113': '☀️',
        '116': '⛅',
        '119': '☁️',
        '122': '☁️',
        '143': '🌫️',
        '176': '🌧️',
        '179': '🌨️',
        '182': '🌧️',
        '185': '🌧️',
        '200': '⛈️',
        '227': '🌨️',
        '230': '❄️',
        '248': '🌫️',
        '260': '🌫️',
        '263': '🌧️',
        '266': '🌧️',
        '281': '🌧️',
        '284': '🌧️',
        '293': '🌧️',
        '296': '🌧️',
        '299': '🌧️',
        '302': '🌧️',
        '305': '🌧️',
        '308': '🌧️',
        '311': '🌧️',
        '314': '🌧️',
        '317': '🌧️',
        '320': '🌨️',
        '323': '🌨️',
        '326': '🌨️',
        '329': '❄️',
        '332': '❄️',
        '335': '❄️',
        '338': '❄️',
        '350': '🌧️',
        '353': '🌧️',
        '356': '🌧️',
        '359': '🌧️',
        '362': '🌧️',
        '365': '🌧️',
        '368': '🌨️',
        '371': '❄️',
        '374': '🌧️',
        '377': '🌧️',
        '386': '⛈️',
        '389': '⛈️',
        '392': '⛈️',
        '395': '❄️'}
    return weatherCodes[code] || '🌤️'}

export default {
    name: 'weather',
    aliases: ['clima', 'tiempo', 'forecast'],
    category: 'tools',
    description: 'Muestra el pronóstico del clima actual y de los próximos días',
    usage: '.weather [ciudad]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        if (args.length === 0) {return await sock.sendMessage(chatId, {text: '⚠️ *Uso correcto:* .weather [ciudad]\n\n*Ejemplos:*\n• .weather Bogotá\n• .weather Madrid\n• .weather New York'}, { quoted: msg })}
        await sock.sendMessage(chatId, {
            react: {
                text: '🌤️',
                key: msg.key}})
        const city = args.join(' ')
        try {const data = await getWeather(city)
            if (!data || !data.current_condition) {return await sock.sendMessage(chatId, {text: '❌ No se pudo obtener el clima para esa ciudad. Verifica el nombre e intenta de nuevo.'}, { quoted: msg })}
            const current = data.current_condition[0]
            const location = data.nearest_area[0]
            const forecast = data.weather
            const weatherEmoji = getWeatherEmoji(current.weatherCode)
            let response = `${weatherEmoji} *CLIMA EN ${location.areaName[0].value.toUpperCase()}*\n`
            response += `📍 ${location.country[0].value}\n\n`
            response += `🌡️ *Temperatura:* ${current.temp_C}°C (${current.temp_F}°F)\n`
            response += `🌡️ *Sensación térmica:* ${current.FeelsLikeC}°C\n`
            response += `☁️ *Condición:* ${current.lang_es?.[0]?.value || current.weatherDesc[0].value}\n`
            response += `💨 *Viento:* ${current.windspeedKmph} km/h ${current.winddir16Point}\n`
            response += `💧 *Humedad:* ${current.humidity}%\n`
            response += `🌧️ *Precipitación:* ${current.precipMM} mm\n`
            response += `👁️ *Visibilidad:* ${current.visibility} km\n`
            response += `🧭 *Presión:* ${current.pressure} mb\n`
            response += `☀️ *UV Index:* ${current.uvIndex}\n\n`
            response += `📅 *PRONÓSTICO 3 DÍAS*\n\n`
            forecast.slice(0, 3).forEach((day, i) => {const date = new Date(day.date)
                const dayName = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : date.toLocaleDateString('es-ES', { weekday: 'long' })
                const emoji = getWeatherEmoji(day.hourly[4].weatherCode)
                response += `${emoji} *${dayName}* (${day.date})\n`
                response += `   🌡️ Máx: ${day.maxtempC}°C | Mín: ${day.mintempC}°C\n`
                response += `   ${day.hourly[4].lang_es?.[0]?.value || day.hourly[4].weatherDesc[0].value}\n`
                response += `   🌧️ Lluvia: ${day.hourly[4].chanceofrain}%\n\n`})
            response += `_Actualizado: ${current.observation_time}_\n`
            response += `> _*Powered by wttr.in*_`
            await sock.sendMessage(chatId, {text: response}, { quoted: msg })} catch (error) {console.error('Error en weather command:', error)
            await sock.sendMessage(chatId, {text: '❌ Error al obtener el clima. Por favor intenta de nuevo.'}, { quoted: msg })}}}
