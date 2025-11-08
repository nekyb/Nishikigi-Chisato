// Codigo creado por: PanDev

import Replicate from "replicate";
import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

const animeyouCommand = {
    name: "animeyou",
    aliases: ["anime", "toanime", "animefy"],
    category: "tools",
    description: "Convierte una foto en estilo anime",
    usage: "#animeyou [imagen]",
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            const quoted =
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMessage =
                msg.message?.imageMessage || quoted?.imageMessage;

            if (!imageMessage) {
                return await sock.sendMessage(chatId, {
                    text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗔𝗡𝗜𝗠𝗘 𝗖𝗢𝗡𝗩𝗘𝗥𝗧𝗘𝗥 ✦
━━━━━━━━━━━━━━━━━━━━━

📸 *Uso:*
- Envía una imagen con el comando
- #animeyou [imagen]
- Responde a una imagen con #animeyou

📌 *Ejemplo:*
- #animeyou (con imagen adjunta)

━━━━━━━━━━━━━━━━━━━━━
⚡ 𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺 𝘋𝘦𝘭𝘵𝘢𝘉𝘺𝘵𝘦`,
                });
            }

            const stream = await downloadContentFromMessage(
                imageMessage,
                "image",
            );
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const base64Image = buffer.toString("base64");
            const dataUri = `data:image/jpeg;base64,${base64Image}`;

            const replicate = new Replicate({
                auth: "r8_NaNBlJsvfkskEqgLgEEMeii94YbUp4m0so2wt",
            });

            const output = await replicate.run(
                "tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c",
                {
                    input: {
                        img: dataUri,
                        version: "v1.4",
                        scale: 2,
                    },
                },
            );

            if (!output) {
                throw new Error("No se pudo procesar la imagen");
            }

            const animeImageUrl =
                typeof output === "string" ? output : output[0];
            const animeImageResponse = await axios.get(animeImageUrl, {
                responseType: "arraybuffer",
            });
            const animeBuffer = Buffer.from(animeImageResponse.data);

            await sock.sendMessage(
                chatId,
                {
                    image: animeBuffer,
                    caption: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗔𝗡𝗜𝗠𝗘 𝗦𝗧𝗬𝗟𝗘 ✦
━━━━━━━━━━━━━━━━━━━━━

✨ Transformación completada

━━━━━━━━━━━━━━━━━━━━━
⚡ 𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺 𝘋𝘦𝘭𝘵𝘢𝘉𝘺𝘵𝘦`,
                    contextInfo: {
                        externalAdReply: {
                            title: "🎨 | Anime Converter - Genesis",
                            body: "Powered by Replicate AI",
                            thumbnailUrl:
                                "https://i.ibb.co/9yKF5xF/anime-style.jpg",
                            sourceUrl: "https://replicate.com",
                            mediaType: 1,
                            renderLargerThumbnail: true,
                        },
                    },
                },
                { quoted: msg },
            );
        } catch (error) {
            console.error("Error en comando animeyou:", error);
            await sock.sendMessage(chatId, {
                text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗘𝗥𝗥𝗢𝗥 ✦
━━━━━━━━━━━━━━━━━━━━━

❌ No se pudo procesar la imagen

💡 Intenta con otra imagen

━━━━━━━━━━━━━━━━━━━━━`,
            });
        }
    },
};

export default animeyouCommand;
