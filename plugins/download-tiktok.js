import fg from "api-dylux";

const tiktokCommand = {
    name: "tiktok",
    aliases: ["ttk", "tt"],
    category: "downloads",
    description: "Descarga videos de TikTok",
    usage: "#tiktok [URL de TikTok]",
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
                        text: `🥷 Debes ingresar un enlace de TikTok.\n\n📌 *Ejemplo:* #tiktok https://vm.tiktok.com/ZMreHF2dC/`,
                    },
                    { quoted: msg },
                );
            }

            const url = args[0];

            if (
                !/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok\.com\/([^\s&]+)/gi.test(
                    url,
                )
            ) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: `❎ Enlace de TikTok inválido.`,
                    },
                    { quoted: msg },
                );
            }

            await sock.sendMessage(chatId, {
                react: { text: "⌛", key: msg.key },
            });

            const data = await fg.tiktok(url);
            const { title, play, duration } = data.result;
            const { nickname } = data.result.author;

            const caption = `⚔️ *Descargador de TikTok*
◦ ✦ *Autor:* ${nickname}
◦ ✦ *Título:* ${title}
◦ ✦ *Duración:* ${duration}`.trim();

            await sock.sendMessage(
                chatId,
                {
                    video: { url: play },
                    caption,
                },
                { quoted: msg },
            );

            await sock.sendMessage(chatId, {
                react: { text: "✅", key: msg.key },
            });
        } catch (error) {
            console.error("Error en comando tiktok:", error);
            await sock.sendMessage(
                chatId,
                {
                    text: `❌ *Error:* ${error.message}`,
                },
                { quoted: msg },
            );
        }
    },
};

export default tiktokCommand;
