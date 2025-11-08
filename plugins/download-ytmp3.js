// plugins/download-ytmp3.js
import fg from "api-dylux";

export default {
    name: "ytmp3",
    aliases: ["yta", "ytaudio"],
    category: "downloads",
    description: "Descarga audio de YouTube",
    usage: "#ytmp3 [url]",
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
                        text: `❗ Debes ingresar una URL de YouTube.\n\nEjemplo: #ytmp3 https://youtu.be/xxxxx`,
                    },
                    { quoted: msg },
                );
            }

            const url = args[0];

            if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: "❎ URL de YouTube inválida.",
                    },
                    { quoted: msg },
                );
            }

            await sock.sendMessage(chatId, {
                react: { text: "⌛", key: msg.key },
            });

            const data = await fg.yta(url);
            const { title, dl_url, size } = data;

            const caption = `🎧 *YouTube Audio*
◦ 📌 *Título:* ${title}
◦ 📦 *Tamaño:* ${size}`.trim();

            await sock.sendMessage(
                chatId,
                {
                    audio: { url: dl_url },
                    mimetype: "audio/mpeg",
                    fileName: `${title}.mp3`,
                },
                { quoted: msg },
            );

            await sock.sendMessage(
                chatId,
                {
                    text: caption,
                },
                { quoted: msg },
            );

            await sock.sendMessage(chatId, {
                react: { text: "✅", key: msg.key },
            });
        } catch (error) {
            console.error("Error en comando ytmp3:", error);
            await sock.sendMessage(
                chatId,
                {
                    text: `❌ *Error:* ${error.message || "No se pudo descargar el audio"}`,
                },
                { quoted: msg },
            );
        }
    },
};
