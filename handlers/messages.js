import {
    config,
    isOwner,
    isOwnerCommand,
    isAdminCommand,
    isGroupCommand,
    getUsedPrefix,
} from "../config/bot.js";
import { isUserAdmin, isBotAdmin } from "../lib/adminUtils.js";
import { isUserBanned } from "../database/users.js";
import antilinkEvent from "../events/antilink.js";
import antinsfwEvent from "../events/anti-porn.js";
import baileys from "@whiskeysockets/baileys";
import { trackMessageActivity } from "../plugins/group-fantasmas-view.js";

const { proto, generateWAMessageFromContent, generateWAMessageContent } =
    baileys;

export async function handleMessage(sock, msg, commands, events) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const chatId = msg.key.remoteJid;
        const userNumber = senderId.split("@")[0];

        if (await isUserBanned(userNumber)) {
            return;
        }

        const isGroup = chatId.endsWith("@g.us");

        // Track message activity for ghost detection
        if (isGroup) {
            trackMessageActivity(chatId, senderId);
        }

        if (isGroup) {
            const userIsAdmin = await isUserAdmin(sock, chatId, senderId);
            const botIsAdmin = await isBotAdmin(sock, chatId);

            // Ejecutar antilink
            const wasRemovedByAntilink = await antilinkEvent.handleMessage(
                sock,
                msg,
                userIsAdmin,
                botIsAdmin,
            );
            if (wasRemovedByAntilink) return;

            // Ejecutar anti-NSFW
            const wasRemovedByAntinsfw = await antinsfwEvent.handleMessage(
                sock,
                msg,
                userIsAdmin,
                botIsAdmin,
            );
            if (wasRemovedByAntinsfw) return;
        }

        if (msg.message?.listResponseMessage) {
            const selectedId =
                msg.message.listResponseMessage.singleSelectReply.selectedRowId;
            await handleListResponse(sock, msg, selectedId, chatId);
            return;
        }

        if (msg.message?.interactiveResponseMessage) {
            try {
                const response = JSON.parse(
                    msg.message.interactiveResponseMessage
                        .nativeFlowResponseMessage.paramsJson,
                );
                const selectedId = response.id;
                await handleButtonResponse(sock, msg, selectedId, chatId);
                return;
            } catch (error) {
                console.error("Error procesando respuesta interactiva:", error);
            }
        }

        if (msg.message?.buttonsResponseMessage) {
            const selectedId =
                msg.message.buttonsResponseMessage.selectedButtonId;
            await handleButtonResponse(sock, msg, selectedId, chatId);
            return;
        }

        const messageText = getMessageText(msg);
        if (!messageText) return;

        const usedPrefix = getUsedPrefix(messageText);
        if (!usedPrefix) return;

        const args = messageText.slice(usedPrefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;
        const command = commands.get(commandName);
        if (!command) return;
        if (config.logs.commands) {
            console.log(
                `📝 Comando: ${usedPrefix}${commandName} | Usuario: ${userNumber} | Grupo: ${isGroup ? "Sí" : "No"}`,
            );
        }
        const canExecute = await checkCommandPermissions(
            sock,
            msg,
            command,
            senderId,
            chatId,
            isGroup,
        );
        if (!canExecute) return;
        try {
            console.log(`🚀 [HANDLER] Ejecutando comando: ${commandName}`)
            await command.execute(sock, msg, args);
            console.log(`✅ [HANDLER] Comando ${commandName} ejecutado`)
        } catch (error) {
            console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.error(`❌ [HANDLER] Error ejecutando comando ${commandName}`)
            console.error(`📋 Error:`, error.message)
            console.error(`📚 Stack:`, error.stack)
            console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            
            // No intentar enviar mensajes si hay problemas de conexión
            const isConnectionError = error.message?.includes('Connection Closed') || 
                                     error.message?.includes('Stream Errored') ||
                                     error.output?.statusCode === 428 ||
                                     error.output?.statusCode === 440;
            
            if (!isConnectionError) {
                try {
                    await sock.sendMessage(chatId, {
                        text: `❌ Error ejecutando el comando.\n\n${error.message}`,
                    });
                } catch (sendError) {
                    console.error(`❌ [HANDLER] No se pudo enviar mensaje de error:`, sendError.message)
                }
            } else {
                console.log(`⚠️ [HANDLER] Error de conexión detectado, esperando reconexión automática...`)
            }
        }
    } catch (error) {
        console.error("Error en handleMessage:", error);
    }
}

async function handleListResponse(sock, msg, selectedId, chatId) {
    try {
        switch (selectedId) {
            case "menu_tiktok":
                await sock.sendMessage(
                    chatId,
                    {
                        text:
                            "📹 *TIKTOK DOWNLOADER*\n\n" +
                            "Uso: #tiktoksearch [búsqueda]\n" +
                            "Ejemplo: #tiktoksearch gatitos\n\n" +
                            "Busca y descarga videos de TikTok",
                    },
                    { quoted: msg },
                );
                break;

            case "menu_pinterest":
                await sock.sendMessage(
                    chatId,
                    {
                        text:
                            "📌 *PINTEREST SEARCH*\n\n" +
                            "Uso: #pinterest [búsqueda]\n" +
                            "Ejemplo: #pinterest aesthetic wallpaper\n\n" +
                            "Busca y descarga imágenes de Pinterest",
                    },
                    { quoted: msg },
                );
                break;

            case "menu_instagram":
                await sock.sendMessage(
                    chatId,
                    {
                        text:
                            "📸 *INSTAGRAM DOWNLOADER*\n\n" +
                            "Uso: #instagram [enlace]\n" +
                            "Ejemplo: #instagram https://instagram.com/p/xxxxx\n\n" +
                            "Descarga posts e historias de Instagram",
                    },
                    { quoted: msg },
                );
                break;

            default:
                await sock.sendMessage(
                    chatId,
                    {
                        text: "⚠️ Esta opción aún no está disponible",
                    },
                    { quoted: msg },
                );
        }
    } catch (error) {
        console.error("Error en handleListResponse:", error);
    }
}

async function handleButtonResponse(sock, msg, selectedId, chatId) {
    try {
        if (selectedId === "info_creador") {
            const vcard =
                "BEGIN:VCARD\n" +
                "VERSION:3.0\n" +
                "FN:DeltaByte\n" +
                "ORG:Nishikigi Chisato Bot;\n" +
                "TEL;type=CELL;type=VOICE;waid=573187994478:+57 318 799 4478\n" +
                "END:VCARD";

            await sock.sendMessage(chatId, {
                contacts: {
                    displayName: "DeltaByte",
                    contacts: [{ vcard }],
                },
            });

            await sock.sendMessage(
                chatId,
                {
                    text:
                        "《✧》 *CREADOR DEL BOT*\n\n" +
                        "👨‍💻 *Nombre:* DeltaByte\n" +
                        "📱 *WhatsApp:* +57 318 799 4478\n" +
                        "🌐 *Web:* https://deltabyte.com\n" +
                        "💬 *Telegram:* @DeltaByte\n\n" +
                        "━━━━━━━━━━━━━━━━━━━\n\n" +
                        "💡 Si tienes dudas, sugerencias o quieres reportar un error, " +
                        "no dudes en contactarlo.\n\n" +
                        "❤️ ¡Gracias por usar Nishikigi Chisato Bot!",
                },
                { quoted: msg },
            );
        }
    } catch (error) {
        console.error("Error en handleButtonResponse:", error);
    }
}

async function checkCommandPermissions(
    sock,
    msg,
    command,
    senderId,
    chatId,
    isGroup,
) {
    const senderNumber = senderId.split("@")[0];
    if (command.ownerOnly || isOwnerCommand(command.name)) {
        if (!isOwner(senderNumber)) {
            await sock.sendMessage(chatId, {
                text: config.messages.notOwner,
            });
            return false;
        }
    }
    if (command.groupOnly || isGroupCommand(command.name)) {
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: config.messages.notGroup,
            });
            return false;
        }
    }
    if (command.adminOnly || isAdminCommand(command.name)) {
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: config.messages.notGroup,
            });
            return false;
        }
        const userIsAdmin = await isUserAdmin(sock, chatId, senderId);
        const userIsOwner = isOwner(senderNumber);
        if (!userIsAdmin && !userIsOwner) {
            await sock.sendMessage(chatId, {
                text: config.messages.notAdmin,
            });
            return false;
        }
    }
    if (command.botAdminRequired) {
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: config.messages.notGroup,
            });
            return false;
        }
        const botIsAdmin = await isBotAdmin(sock, chatId);
        if (!botIsAdmin) {
            await sock.sendMessage(chatId, {
                text: config.messages.notBotAdmin,
            });
            return false;
        }
    }
    return true;
}

export function getMessageText(msg) {
    try {
        if (msg.message?.conversation) {
            return msg.message.conversation;
        }
        if (msg.message?.extendedTextMessage?.text) {
            return msg.message.extendedTextMessage.text;
        }
        if (msg.message?.imageMessage?.caption) {
            return msg.message.imageMessage.caption;
        }
        if (msg.message?.videoMessage?.caption) {
            return msg.message.videoMessage.caption;
        }
        return null;
    } catch (error) {
        return null;
    }
}

export function getMentionedUser(msg) {
    try {
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            return msg.message.extendedTextMessage.contextInfo.participant;
        }
        if (msg.quoted?.sender) {
            return msg.quoted.sender;
        }
        return null;
    } catch (error) {
        return null;
    }
}

export function hasImage(msg) {
    return !!msg.message?.imageMessage;
}

export async function downloadMedia(sock, msg) {
    try {
        const buffer = await sock.downloadMediaMessage(msg);
        return buffer;
    } catch (error) {
        console.error("Error descargando media:", error);
        return null;
    }
}

export async function reply(sock, chatId, text, quotedMsg) {
    try {
        await sock.sendMessage(chatId, {
            text: text,
            ...(quotedMsg && { quoted: quotedMsg }),
        });
    } catch (error) {
        console.error("Error enviando respuesta:", error);
    }
}

export async function sendWithMention(sock, chatId, text, mentions) {
    try {
        await sock.sendMessage(chatId, {
            text: text,
            mentions: mentions,
        });
    } catch (error) {
        console.error("Error enviando mensaje con mención:", error);
    }
}

export async function createVideoMessage(sock, url) {
    try {
        const message = await generateWAMessageContent(
            {
                video: { url },
            },
            {
                upload: sock.waUploadToServer,
            },
        );

        return message.videoMessage;
    } catch (error) {
        console.error("Error creando video message:", error);
        throw error;
    }
}

export async function sendCarousel(sock, chatId, options, quotedMsg) {
    try {
        const { cards, headerText, footerText } = options;

        if (!cards || cards.length === 0) {
            throw new Error("No hay tarjetas para mostrar en el carousel");
        }

        const messageContent = generateWAMessageFromContent(
            chatId,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                        },
                        interactiveMessage:
                            proto.Message.InteractiveMessage.fromObject({
                                body: proto.Message.InteractiveMessage.Body.create(
                                    {
                                        text: headerText || "",
                                    },
                                ),
                                footer: proto.Message.InteractiveMessage.Footer.create(
                                    {
                                        text: footerText || "",
                                    },
                                ),
                                header: proto.Message.InteractiveMessage.Header.create(
                                    {
                                        hasMediaAttachment: false,
                                    },
                                ),
                                carouselMessage:
                                    proto.Message.InteractiveMessage.CarouselMessage.fromObject(
                                        {
                                            cards: cards,
                                        },
                                    ),
                            }),
                    },
                },
            },
            {
                quoted: quotedMsg,
            },
        );

        await sock.relayMessage(chatId, messageContent.message, {
            messageId: messageContent.key.id,
        });

        return true;
    } catch (error) {
        console.error("Error enviando carousel:", error);
        return false;
    }
}

export async function createCarouselCard(sock, title, videoUrl, footerText) {
    try {
        const videoMessage = await createVideoMessage(sock, videoUrl);

        if (!videoMessage) {
            console.error("No se pudo crear el videoMessage");
            return null;
        }

        return {
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: null,
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: footerText || "",
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: title || "",
                hasMediaAttachment: true,
                videoMessage: videoMessage,
            }),
            nativeFlowMessage:
                proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [],
                }),
        };
    } catch (error) {
        console.error("Error creando tarjeta de carousel:", error);
        return null;
    }
}

export default {
    handleMessage,
    getMessageText,
    getMentionedUser,
    hasImage,
    downloadMedia,
    reply,
    sendWithMention,
    createVideoMessage,
    sendCarousel,
    createCarouselCard,
};