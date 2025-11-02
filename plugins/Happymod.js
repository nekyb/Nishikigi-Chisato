import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, `🚩 Ingrese el nombre del juego.\n\nEjemplo:\n> *${usedPrefix + command}* Minecraft`, m, rcanal);

    await m.react('🕓');

    try {
        const response = await axios.get(`https://api.dorratz.com/v2/happymod-s?query=${encodeURIComponent(text)}`);
        const mods = response.data;

        if (!mods || mods.length === 0) {
            return conn.reply(m.chat, `😞 No se pudo encontrar mods para "${text}".`, m);
        }

        let message = '`乂  H A P P Y M O D  -  B Ú S Q U E`\n\n';
        mods.forEach(mod => {
            message += `  ✩   Nombre : ${mod.name}\n`;
            message += `  ✩   Valoración : ${mod.rating}\n`;
            message += `  ✩   Enlace : ${mod.link}\n`;
            message += `  ✩   Icono : ${mod.icon}\n\n`;
        });

        await conn.sendMessage(m.chat, { text: message }, { quoted: m });
        await m.react('✅');
    } catch (error) {
        console.error(error);
        await m.react('✖️');
        conn.reply(m.chat, `Error al obtener la información de los mods.`, m);
    }
};

handler.help = ['happymodsearch *<búsqueda>*'];
handler.tags = ['search'];
handler.command = ['happymodsearch'];
handler.register = true;

export default handler;
