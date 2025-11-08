// plugins/download-play.js
import yts from "yt-search";

export default {
    name: "play",
    aliases: ["playvid", "play2"],
    category: "downloads",
    description: "Busca y descarga música o video de YouTube",
    usage: "#play [nombre del video]",
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        try {
            if (args.length === 0) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: `❗ Por favor ingresa un texto para buscar.\nEjemplo: #play Nombre del video`,
                    },
                    { quoted: msg },
                );
            }

            const text = args.join(" ");

            await sock.sendMessage(chatId, {
                react: { text: "🔍", key: msg.key },
            });

            const search = await yts(text);
            const videoInfo = search.all?.[0];

            if (!videoInfo) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: "❗ No se encontraron resultados para tu búsqueda. Intenta con otro título.",
                    },
                    { quoted: msg },
                );
            }

            const body = `⚔️ *El mejor bot de WhatsApp*

📺 *Título:* ${videoInfo.title}
👤 *Canal:* ${videoInfo.author?.name || "Desconocido"}
⏱️ *Duración:* ${videoInfo.timestamp}
👁️ *Vistas:* ${videoInfo.views?.toLocaleString() || "N/A"}

Elige una de las opciones para descargar:
🎧 *Audio* o 📽️ *Video*`;

            const buttons = [
                {
                    buttonId: `#ytmp3 ${videoInfo.url}`,
                    buttonText: { displayText: "🎧 Audio" },
                    type: 1,
                },
                {
                    buttonId: `#ytmp4 ${videoInfo.url}`,
                    buttonText: { displayText: "📽️ Video" },
                    type: 1,
                },
                {
                    buttonId: `#ytmp3doc ${videoInfo.url}`,
                    buttonText: { displayText: "💿 Audio Doc" },
                    type: 1,
                },
                {
                    buttonId: `#ytmp4doc ${videoInfo.url}`,
                    buttonText: { displayText: "🎥 Video Doc" },
                    type: 1,
                },
            ];

            const buttonMessage = {
                image: { url: videoInfo.thumbnail },
                caption: body,
                footer: "𝕭𝖑𝖆𝖈𝖐 𝕮𝖑𝖔𝖛𝖊𝖗 ☘︎| ⚔️🥷",
                buttons: buttons,
                headerType: 4,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false,
                        title: "📡 Descargas YouTube",
                        body: "✡︎ Dev • DeltaByte",
                        mediaType: 2,
                        sourceUrl: videoInfo.url,
                        thumbnailUrl: videoInfo.thumbnail,
                    },
                },
            };

            await sock.sendMessage(chatId, buttonMessage, { quoted: msg });
            await sock.sendMessage(chatId, {
                react: { text: "✅", key: msg.key },
            });
        } catch (error) {
            console.error("Error en comando play:", error);
            await sock.sendMessage(
                chatId,
                {
                    text: "❌ Error al buscar el video. Intenta de nuevo.",
                },
                { quoted: msg },
            );
        }
    },
};
