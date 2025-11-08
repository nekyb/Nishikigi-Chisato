// plugins/download-ytmp4.js
import fg from "api-dylux";

export default {
    name: "ytmp4",
    aliases: ["ytv", "ytvideo"],
    category: "downloads",
    description: "Descarga video de YouTube",
    usage: "#ytmp4 [url]",
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
                        text: `❗ Debes ingresar una URL de YouTube.\n\nEjemplo: #ytmp4 https://youtu.be/xxxxx`,
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

            const data = await fg.ytv(url);
            const { title, dl_url, size } = data;

            const caption = `📽️ *YouTube Video*
◦ 📌 *Título:* ${title}
◦ 📦 *Tamaño:* ${size}`.trim();

            await sock.sendMessage(
                chatId,
                {
                    video: { url: dl_url },
                    caption,
                    mimetype: "video/mp4",
                },
                { quoted: msg },
            );

            await sock.sendMessage(chatId, {
                react: { text: "✅", key: msg.key },
            });
        } catch (error) {
            console.error("Error en comando ytmp4:", error);
            await sock.sendMessage(
                chatId,
                {
                    text: `❌ *Error:* ${error.message || "No se pudo descargar el video"}`,
                },
                { quoted: msg },
            );
        }
    },
};
