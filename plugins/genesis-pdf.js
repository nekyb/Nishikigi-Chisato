// Codigo creado por: PanDev

import { GoogleGenerativeAI } from "@google/generative-ai";
import pkg from '@soblend/baileys';
const { downloadContentFromMessage } = pkg;;
import PDFDocument from "pdfkit";

const gempdfCommand = {
    name: "gempdf",
    aliases: ["pdf", "topdf", "imagestopdf"],
    category: "tools",
    description: "Convierte múltiples imágenes en un PDF organizado",
    usage: "#gempdf",
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    sessions: new Map(),

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;
        try {
            if (!this.sessions.has(userId)) {
                this.sessions.set(userId, {
                    images: [],
                    chatId: chatId,
                    waitingForImages: true,
                });

                const sentMsg = await sock.sendMessage(
                    chatId,
                    {
                        text: `╭─────────────────╮
│  📄 *GEMINI PDF CREATOR*  │
╰─────────────────╯

✨ *Sesión iniciada correctamente*

📸 Responde a este mensaje enviando todas las imágenes que desees convertir a PDF

> _*By Soblend | Development Studio Creative*_`,
                    },
                    { quoted: msg },
                );

                // Guardar el key del mensaje para detectar respuestas
                this.sessions.get(userId).replyToKey = sentMsg.key.id;

                return;
            }
        } catch (error) {
            console.error("Error en comando gempdf:", error);
            this.sessions.delete(userId);
            await sock.sendMessage(chatId, {
                text: `╭──────────╮
│  ⚠️ *ERROR*  │
╰──────────╯

Ocurrió un error inesperado en el proceso

💡 *Tip:* Intenta nuevamente con el comando #gempdf

> _*By Soblend | Development Studio Creative*_`,
            });
        }
    },

    async handleIncomingMessage(sock, msg) {
        const userId = msg.key.participant || msg.key.remoteJid;
        const chatId = msg.key.remoteJid;

        if (!this.sessions.has(userId)) return false;

        const session = this.sessions.get(userId);
        if (!session.waitingForImages) return false;

        // Verificar si es respuesta al mensaje del bot
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
        const isReply = quotedMsg && quotedMsg.stanzaId === session.replyToKey;

        if (!isReply) return false;

        const imageMessage = msg.message?.imageMessage;

        if (imageMessage) {
            try {
                const stream = await downloadContentFromMessage(
                    imageMessage,
                    "image",
                );
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                session.images.push({
                    buffer: buffer,
                    caption: imageMessage.caption || "",
                    timestamp: Date.now(),
                });

                await sock.sendMessage(
                    chatId,
                    {
                        text: `✅ *Imagen ${session.images.length} recibida*`,
                    },
                    { quoted: msg },
                );

                return true;
            } catch (error) {
                console.error("Error descargando imagen:", error);
                return false;
            }
        }

        // Si no es imagen pero es respuesta al bot, generar PDF
        if (!imageMessage && session.images.length > 0) {
            session.waitingForImages = false;
            await this.generatePDF(sock, msg, userId);
            return true;
        }

        return false;
    },

    async generatePDF(sock, msg, userId) {
        const chatId = msg.key.remoteJid;
        const session = this.sessions.get(userId);

        if (!session || session.images.length === 0) {
            this.sessions.delete(userId);
            return await sock.sendMessage(chatId, {
                text: `╭──────────╮
│  ⚠️ *ERROR*  │
╰──────────╯

No se encontraron imágenes para procesar

🔄 Inicia una nueva sesión con #gempdf

> _*By Soblend | Development Studio Creative*_`,
            });
        }

        try {
            await sock.sendMessage(
                chatId,
                {
                    text: `╭───────────────────╮
│  🤖 *PROCESANDO CON AI*  │
╰───────────────────╯

🧠 *Gemini AI está analizando tus imágenes...*

📊 Total de imágenes: ${session.images.length}
⚡ Optimizando orden y calidad...

_Esto puede tardar unos segundos_

> _*By Soblend | Development Studio Creative*_`,
                },
                { quoted: msg },
            );

            // Analizar imágenes con Gemini AI
            const organizedImages = await this.analyzeAndOrganizeImages(
                session.images,
            );

            // Crear PDF
            const pdfBuffer = await this.createPDF(organizedImages);

            const fileName = `Genesis_PDF_${Date.now()}.pdf`;

            await sock.sendMessage(
                chatId,
                {
                    document: pdfBuffer,
                    fileName: fileName,
                    mimetype: "application/pdf",
                    caption: `╭──────────────────╮
│  ✅ *PDF GENERADO*  │
╰──────────────────╯

📄 *Archivo:* ${fileName}
📊 *Páginas:* ${organizedImages.length}
🤖 *Procesado con:* Gemini AI
✨ *Calidad:* Alta definición

> _*By Soblend | Development Studio Creative*_`,
                    contextInfo: {
                        externalAdReply: {
                            title: "📄 Genesis PDF Generator",
                            body: "Powered by Gemini AI • Soblend Studio",
                            thumbnailUrl:
                                "https://i.ibb.co/7XqG5Zp/pdf-icon.jpg",
                            sourceUrl: "https://ai.google.dev",
                            mediaType: 1,
                            renderLargerThumbnail: true,
                        },
                    },
                },
                { quoted: msg },
            );

            this.sessions.delete(userId);
        } catch (error) {
            console.error("Error generando PDF:", error);
            this.sessions.delete(userId);
            await sock.sendMessage(chatId, {
                text: `╭──────────╮
│  ⚠️ *ERROR*  │
╰──────────╯

No se pudo generar el PDF

❌ *Posibles causas:*
   • Imágenes muy pesadas
   • Formato incompatible
   • Error de conexión

🔄 Intenta nuevamente

> _*By Soblend | Development Studio Creative*_`,
            });
        }
    },

    async analyzeAndOrganizeImages(images) {
        try {
            const genAI = new GoogleGenerativeAI(
                "AIzaSyDR01zJZyCyWUgF7QbVFZXZTGlLt1bMf9M",
            );
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
            });

            const analyzedImages = [];

            for (let i = 0; i < images.length; i++) {
                const image = images[i];

                try {
                    const imageParts = [
                        {
                            inlineData: {
                                data: image.buffer.toString("base64"),
                                mimeType: "image/jpeg",
                            },
                        },
                    ];

                    const prompt = `Analiza esta imagen brevemente y describe:
1. Tipo de contenido (documento, foto, captura, etc)
2. ¿Tiene texto visible? ¿Qué dice?
3. ¿Es parte de una secuencia? (ej: página 1, paso 1, etc)
4. Número de página si es visible

Responde en formato: TIPO | TEXTO_PRINCIPAL | SECUENCIA | PAGINA`;

                    const result = await model.generateContent([
                        prompt,
                        ...imageParts,
                    ]);
                    const analysis = result.response.text();

                    analyzedImages.push({
                        ...image,
                        index: i,
                        analysis: analysis,
                        order: this.extractOrder(analysis, i),
                    });
                } catch (error) {
                    console.error(`Error analizando imagen ${i + 1}:`, error);
                    analyzedImages.push({
                        ...image,
                        index: i,
                        analysis: "No analizado",
                        order: i,
                    });
                }
            }

            analyzedImages.sort((a, b) => {
                if (a.order !== b.order) {
                    return a.order - b.order;
                }
                return a.index - b.index;
            });

            return analyzedImages;
        } catch (error) {
            console.error("Error en análisis de Gemini:", error);
            return images.map((img, i) => ({ ...img, index: i, order: i }));
        }
    },

    extractOrder(analysis, defaultOrder) {
        const pageMatch = analysis.match(
            /p[áa]gina\s*(\d+)|page\s*(\d+)|(\d+)\s*\/\s*\d+/i,
        );
        if (pageMatch) {
            return parseInt(pageMatch[1] || pageMatch[2] || pageMatch[3]);
        }

        const stepMatch = analysis.match(
            /paso\s*(\d+)|step\s*(\d+)|secuencia\s*(\d+)/i,
        );
        if (stepMatch) {
            return parseInt(stepMatch[1] || stepMatch[2] || stepMatch[3]);
        }

        return defaultOrder;
    },

    async createPDF(images) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                autoFirstPage: false,
                bufferPages: true,
            });

            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            images.forEach((image, index) => {
                doc.addPage({
                    size: "A4",
                    margins: {
                        top: 20,
                        bottom: 20,
                        left: 20,
                        right: 20,
                    },
                });

                const pageWidth = doc.page.width - 40;
                const pageHeight = doc.page.height - 40;

                doc.image(image.buffer, 20, 20, {
                    fit: [pageWidth, pageHeight],
                    align: "center",
                    valign: "center",
                });

                doc.fontSize(8)
                    .fillColor("#666666")
                    .text(
                        `Página ${index + 1} de ${images.length}`,
                        20,
                        doc.page.height - 30,
                        { align: "center" },
                    );

                if (image.caption) {
                    doc.fontSize(10)
                        .fillColor("#333333")
                        .text(image.caption, 20, 30, {
                            width: pageWidth,
                            align: "center",
                        });
                }
            });

            doc.end();
        });
    },
};

export default gempdfCommand;
