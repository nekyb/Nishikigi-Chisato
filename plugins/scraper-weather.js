import axios from 'axios';

export default {
    name: 'weather',
    aliases: ['clima', 'tiempo'],
    category: 'scraper',
    description: 'Obtiene el clima actual de cualquier ciudad',
    usage: '#weather [ciudad]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Clima Mundial*\n\n` +
                        `Uso: #weather [ciudad]\n\n` +
                        `Ejemplos:\n` +
                        `✿ #weather Bogotá\n` +
                        `✿ #weather New York\n` +
                        `✿ #clima Tokyo`
                });
            }

            const city = args.join(' ');
            const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            const data = response.data;
            const current = data.current_condition[0];
            const location = data.nearest_area[0];
            const weatherDesc = current.lang_es?.[0]?.value || current.weatherDesc[0].value;
            const tempC = current.temp_C;
            const feelsLikeC = current.FeelsLikeC;
            const humidity = current.humidity;
            const windKmph = current.windspeedKmph;
            const pressure = current.pressure;
            const visibility = current.visibility;
            const uvIndex = current.uvIndex;
            const weatherEmoji = {
                'Sunny': '☀️',
                'Clear': '🌙',
                'Partly cloudy': '⛅',
                'Cloudy': '☁️',
                'Overcast': '☁️',
                'Mist': '🌫️',
                'Fog': '🌫️',
                'Light rain': '🌧️',
                'Rain': '🌧️',
                'Heavy rain': '⛈️',
                'Thunderstorm': '⛈️',
                'Snow': '❄️',
                'Blizzard': '🌨️'
            };

            const emoji = weatherEmoji[current.weatherDesc[0].value] || '🌤️';
            await sock.sendMessage(chatId, {
                text: `《✧》 *Clima en ${location.areaName[0].value}, ${location.country[0].value}*\n\n` +
                    `${emoji} *Estado:* ${weatherDesc}\n\n` +
                    `🌡️ *Temperatura:* ${tempC}°C\n` +
                    `🤔 *Sensación térmica:* ${feelsLikeC}°C\n` +
                    `💧 *Humedad:* ${humidity}%\n` +
                    `💨 *Viento:* ${windKmph} km/h\n` +
                    `📊 *Presión:* ${pressure} mb\n` +
                    `👁️ *Visibilidad:* ${visibility} km\n` +
                    `☀️ *Índice UV:* ${uvIndex}\n\n` +
                    `📅 *Actualizado:* ${current.observation_time}\n\n` +
                    `_Datos proporcionados por wttr.in_`
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en weather:', error);
            await sock.sendMessage(chatId, {
                text: `《✧》 ❌ Error al obtener el clima.\n\n` +
                    `Verifica que el nombre de la ciudad sea correcto.`
            });
        }
    }
};
