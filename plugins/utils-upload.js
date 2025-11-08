import FormData from "form-data";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import fetch from "node-fetch";

const UPLOAD_API =
    "https://rogddqelmxyuvhpjvxbf.supabase.co/functions/v1/upload-api";
const MAX_SIZE = 100 * 1024 * 1024;

const uploadCommand = {
    name: "upload",
    aliases: ["subir"],
    category: "tools",
    description: "Sube archivos y obtén un link directo",
    usage: "#upload o #subir (responde a un archivo)",
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        try {
            const quotedMsg =
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMsg) {
                await sock.sendMessage(
                    chatId,
                    {
                        text:
                            "《✧》 Por favor responde a un archivo para subirlo.\n\n" +
                            "*Tipos soportados:*\n" +
                            "• Imágenes\n" +
                            "• Videos\n" +
                            "• Audios\n" +
                            "• Documentos\n" +
                            "• Stickers",
                    },
                    { quoted: msg },
                );
                return;
            }

            let mediaType = null;
            let mediaMsg = null;
            let fileName = "archivo";
            let mimeType = "application/octet-stream";

            if (quotedMsg.imageMessage) {
                mediaType = "image";
                mediaMsg = quotedMsg.imageMessage;
                fileName = `imagen_${Date.now()}.jpg`;
                mimeType = mediaMsg.mimetype || "image/jpeg";
            } else if (quotedMsg.videoMessage) {
                mediaType = "video";
                mediaMsg = quotedMsg.videoMessage;
                fileName = `video_${Date.now()}.mp4`;
                mimeType = mediaMsg.mimetype || "video/mp4";
            } else if (quotedMsg.audioMessage) {
                mediaType = "audio";
                mediaMsg = quotedMsg.audioMessage;
                fileName = `audio_${Date.now()}.mp3`;
                mimeType = mediaMsg.mimetype || "audio/mpeg";
            } else if (quotedMsg.documentMessage) {
                mediaType = "document";
                mediaMsg = quotedMsg.documentMessage;
                fileName = mediaMsg.fileName || `documento_${Date.now()}`;
                mimeType = mediaMsg.mimetype || "application/octet-stream";
            } else if (quotedMsg.stickerMessage) {
                mediaType = "sticker";
                mediaMsg = quotedMsg.stickerMessage;
                fileName = `sticker_${Date.now()}.webp`;
                mimeType = "image/webp";
            } else {
                await sock.sendMessage(
                    chatId,
                    {
                        text: "《✧》 El mensaje citado no contiene un archivo válido.",
                    },
                    { quoted: msg },
                );
                return;
            }

            const fileSize = mediaMsg.fileLength || 0;
            const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

            if (fileSize > MAX_SIZE) {
                await sock.sendMessage(
                    chatId,
                    {
                        text:
                            `《✧》 El archivo es demasiado grande (${fileSizeMB} MB).\n\n` +
                            `⚠️ Límite máximo: 100 MB`,
                    },
                    { quoted: msg },
                );
                return;
            }

            await sock.sendMessage(
                chatId,
                {
                    text:
                        `⏳ Subiendo archivo...\n\n` +
                        `📁 *Nombre:* ${fileName}\n` +
                        `💾 *Tamaño:* ${fileSizeMB} MB`,
                },
                { quoted: msg },
            );

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

            const fullMsg = {
                key: contextInfo?.participant
                    ? {
                          remoteJid: chatId,
                          fromMe: false,
                          id: contextInfo.stanzaId,
                          participant: contextInfo.participant,
                      }
                    : {
                          remoteJid: chatId,
                          fromMe: false,
                          id: contextInfo?.stanzaId || msg.key.id,
                      },
                message: quotedMsg,
            };

            const buffer = await downloadMediaMessage(
                fullMsg,
                "buffer",
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage,
                },
            );

            const formData = new FormData();
            formData.append("file", buffer, {
                filename: fileName,
                contentType: mimeType,
            });

            const response = await fetch(UPLOAD_API, {
                method: "POST",
                body: formData,
                headers: {
                    ...formData.getHeaders(),
                },
            });

            const responseText = await response.text();

            if (!response.ok) {
                console.error("Error del servidor:", responseText);
                throw new Error(
                    `Error ${response.status}: ${responseText.substring(0, 100)}`,
                );
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Error parseando respuesta:", responseText);
                throw new Error("Respuesta inválida del servidor");
            }

            if (result.url) {
                await sock.sendMessage(
                    chatId,
                    {
                        text:
                            `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  *✅ Archivo Subido*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `📁 *Nombre:* ${fileName}\n` +
                            `💾 *Tamaño:* ${fileSizeMB} MB\n` +
                            `📊 *Tipo:* ${mediaType}\n\n` +
                            `🔗 *Link directo:*\n${result.url}`,
                    },
                    { quoted: msg },
                );
            } else {
                await sock.sendMessage(
                    chatId,
                    {
                        text: `《✧》 Error al subir el archivo:\n${result.error || "Error desconocido"}`,
                    },
                    { quoted: msg },
                );
            }
        } catch (error) {
            console.error("Error en comando upload:", error);

            let errorMsg = "《✧》 Error al subir el archivo.";

            if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
                errorMsg =
                    "《✧》 Tiempo de espera agotado. El archivo es muy grande o la conexión es lenta.";
            } else if (error.message?.includes("Error 500")) {
                errorMsg =
                    "《✧》 Error del servidor. El servicio puede estar temporalmente no disponible.";
            } else if (error.message?.includes("Error")) {
                errorMsg = `《✧》 ${error.message}`;
            }

            await sock.sendMessage(
                chatId,
                {
                    text:
                        errorMsg +
                        "\n\n💡 *Tip:* Intenta con un archivo más pequeño o espera unos minutos.",
                },
                { quoted: msg },
            );
        }
    },
};

export default uploadCommand;
