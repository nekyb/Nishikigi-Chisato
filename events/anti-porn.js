import {
    getGroupSettings,
    updateGroupWarnings,
    getGroupWarnings,
} from "../database/users.js";
import sharp from "sharp";

let tf = null;
let nsfwjs = null;

try {
    tf = await import("@tensorflow/tfjs-node");
    await tf.ready();
    nsfwjs = await import("nsfwjs");
} catch (error) {
    tf = null;
    nsfwjs = null;
}

export const antinsfwEvent = {
    name: "antinsfw",
    enabled: tf !== null && nsfwjs !== null,
    model: null,
    metadataCache: new Map(),
    cacheTimeout: 60000,

    config: {
        maxWarnings: 2,
        deleteDelay: 500,
        kickDelay: 2000,
        threshold: 0.6,
        strictMode: false,
        processTimeout: 30000,
    },

    categories: {
        Porn: { threshold: 0.6, strict: 0.4, severity: "high" },
        Hentai: { threshold: 0.7, strict: 0.5, severity: "high" },
        Sexy: { threshold: 0.8, strict: 0.6, severity: "medium" },
        Neutral: { threshold: 1.0, strict: 1.0, severity: "none" },
        Drawing: { threshold: 1.0, strict: 1.0, severity: "none" },
    },

    async getGroupMetadata(sock, groupJid) {
        const cached = this.metadataCache.get(groupJid);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const metadata = await sock.groupMetadata(groupJid);
            this.metadataCache.set(groupJid, {
                data: metadata,
                timestamp: Date.now(),
            });
            return metadata;
        } catch (error) {
            if (error.data === 429) {
                if (cached) return cached.data;
            }
            throw error;
        }
    },

    async checkBotAdmin(sock, groupJid) {
        try {
            if (!groupJid.endsWith("@g.us")) return true;

            const groupMetadata = await this.getGroupMetadata(sock, groupJid);
            const participants = groupMetadata.participants || [];
            const botNumber = sock.user.id.split(":")[0].split("@")[0];

            const botParticipant = participants.find((p) => {
                const participantId = p.id?.split("@")?.[0];
                const participantIdWithoutColon = participantId?.split(":")[0];
                
                return (
                    participantId === botNumber ||
                    participantIdWithoutColon === botNumber ||
                    p.id === sock.user.id ||
                    p.id === `${botNumber}@s.whatsapp.net` ||
                    p.id === `${botNumber}@lid` ||
                    p.id === `${botNumber}:48@lid` ||
                    participantId?.includes(botNumber)
                );
            });
            
            if (botParticipant) {
                return botParticipant.admin === "admin" || botParticipant.admin === "superadmin";
            }

            try {
                await this.getGroupMetadata(sock, groupJid);
                return true;
            } catch {
                return false;
            }
        } catch (error) {
            return false;
        }
    },

    async initialize() {
        if (this.model) return this.model;
        try {
            if (!nsfwjs) {
                this.enabled = false;
                return null;
            }
            this.model = await nsfwjs.load();
            return this.model;
        } catch (error) {
            this.enabled = false;
            return null;
        }
    },

    async handleMessage(sock, msg, isAdmin) {
        const groupJid = msg.key.remoteJid;

        try {
            if (!groupJid.endsWith("@g.us") || !this.enabled) return false;

            const isBotAdmin = await this.checkBotAdmin(sock, groupJid);

            if (isAdmin && isBotAdmin) return false;

            const settings = await getGroupSettings(groupJid);
            if (!settings?.antinsfw) return false;

            const mediaType = this.getMediaType(msg);
            if (!mediaType) return false;

            if (!this.model) {
                await this.initialize();
                if (!this.model) return false;
            }

            const analysis = await this.analyzeMedia(sock, msg, mediaType);
            if (!analysis) return false;

            if (analysis.isNSFW) {
                console.log("🚨 ¡CONTENIDO NSFW DETECTADO!");

                if (!isBotAdmin) {
                    console.log(
                        "⚠️ Bot NO es admin - Alertando a administradores",
                    );
                    await this.alertAdminsNoPermission(
                        sock,
                        msg,
                        analysis,
                        isAdmin,
                    );
                    return false;
                }

                if (isBotAdmin && isAdmin) {
                    console.log(
                        "⚠️ Usuario es admin - Advertencia suave sin castigo",
                    );
                    await this.warnAdmin(sock, msg, analysis);
                    return false;
                }

                console.log("⚡ Aplicando castigo a usuario normal...");
                await this.applyPunishment(sock, msg, analysis);
                console.log("✅ Castigo aplicado exitosamente");
                return true;
            }

            console.log("✅ Contenido seguro");
            return false;
        } catch (error) {
            // console.error("❌ Error crítico en antinsfw:", error);
            return false;
        } finally {
        }
    },

    getMediaType(msg) {
        const message = msg.message;
        if (message?.imageMessage) return "image";
        if (message?.videoMessage) return "video";
        if (message?.stickerMessage) return "sticker";
        return null;
    },

    async analyzeMedia(sock, msg, mediaType) {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("Timeout")),
                    this.config.processTimeout,
                ),
            );
            const analysisPromise = this._performAnalysis(sock, msg, mediaType);
            const result = await Promise.race([
                analysisPromise,
                timeoutPromise,
            ]);
            return result;
        } catch (error) {
            if (error.message === "Timeout") {
                // console.error("⏱️ Timeout analizando media");
            } else {
                // console.error("❌ Error analizando media:", error);
            }
            return null;
        }
    },

    async _performAnalysis(sock, msg, mediaType) {
        try {
            const buffer = await sock.downloadMediaMessage(msg);

            if (!buffer) {
                // console.error("❌ No se pudo descargar la media");
                return null;
            }

            let imageBuffer = buffer;
            if (mediaType === "video") {
                imageBuffer = await this.extractVideoFrame(buffer);
                if (!imageBuffer) return null;
            }

            const image = sharp(imageBuffer).resize(224, 224, { fit: "cover" });
            const { data, info } = await image
                .raw()
                .toBuffer({ resolveWithObject: true });

            if (info.channels !== 3) {
                // console.error("❌ La imagen no tiene 3 canales RGB");
                return null;
            }

            const tensor = tf.tensor3d(Array.from(data), [
                info.height,
                info.width,
                info.channels,
            ]);
            const predictions = await this.model.classify(tensor);
            tensor.dispose();

            return this.evaluatePredictions(predictions);
        } catch (error) {
            // console.error("❌ Error en análisis:", error);
            return null;
        }
    },

    async extractVideoFrame(videoBuffer) {
        try {
            const frame = await sharp(videoBuffer, {
                animated: false,
                page: 0,
            })
                .resize(224, 224)
                .toBuffer();
            return frame;
        } catch (error) {
            // console.error("❌ Error extrayendo frame:", error);
            return null;
        }
    },

    evaluatePredictions(predictions) {
        console.log("📊 Predicciones del modelo:", predictions);

        const useStrictMode = this.config.strictMode;
        let isNSFW = false;
        let detectedCategory = null;
        let confidence = 0;
        let severity = "none";

        for (const prediction of predictions) {
            const category = this.categories[prediction.className];
            if (!category) continue;

            const threshold = useStrictMode
                ? category.strict
                : category.threshold;

            if (
                prediction.probability >= threshold &&
                category.severity !== "none"
            ) {
                isNSFW = true;
                detectedCategory = prediction.className;
                confidence = prediction.probability;
                severity = category.severity;
                break;
            }
        }

        return {
            isNSFW,
            category: detectedCategory,
            confidence: (confidence * 100).toFixed(2),
            severity,
            allPredictions: predictions.map((p) => ({
                class: p.className,
                probability: (p.probability * 100).toFixed(2) + "%",
            })),
        };
    },

    async alertAdminsNoPermission(sock, msg, analysis, senderIsAdmin) {
        const groupJid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const userNumber = sender.split("@")[0];

        try {
            const groupMetadata = await this.getGroupMetadata(sock, groupJid);
            const admins = groupMetadata.participants
                .filter((p) => p.admin === "admin" || p.admin === "superadmin")
                .map((p) => p.id);

            const severityText =
                analysis.severity === "high" ? "MUY GRAVE" : "GRAVE";
            const categoryText =
                analysis.category === "Porn"
                    ? "contenido explícito"
                    : analysis.category === "Hentai"
                      ? "contenido inapropiado"
                      : "contenido sugestivo";

            let alertMsg;

            if (senderIsAdmin) {
                alertMsg = `Ey admins 🚨

El admin @${userNumber} acaba de enviar ${categoryText} y yo no tengo permisos para eliminarlo.

Detalles de lo que detecté:
✩ Tipo: ${analysis.category}
✩ Confianza: ${analysis.confidence}%
✩ Gravedad: ${severityText}

Normalmente yo no me meto con los admins, pero como no tengo permisos aquí ni siquiera puedo borrar el mensaje. Revísenlo ustedes y decidan qué hacer.

Si me hacen admin del grupo, puedo manejar esto automáticamente (aunque igual dejaría pasar a los admins, solo alertaría en privado) 😅`;
            } else {
                alertMsg = `Ey admins, necesito ayuda urgente 🚨

@${userNumber} acaba de enviar ${categoryText} y yo no puedo hacer nada porque no tengo permisos de admin.

Lo que detecté:
✩ Tipo: ${analysis.category}
✩ Confianza: ${analysis.confidence}%
✩ Gravedad: ${severityText}

Por favor revisen el mensaje y tomen acción. Si quieren que yo me encargue automáticamente de estas cosas, solo háganme admin del grupo.

Mientras tanto, les toca manejarlo ustedes 👀`;
            }

            const mentions = [sender, ...admins];

            await sock.sendMessage(groupJid, {
                text: alertMsg,
                mentions: mentions,
            });

            console.log(
                `🔔 Alerta enviada. Admins mencionados: ${admins.length}`,
            );
        } catch (error) {
            // console.error("❌ Error enviando alerta a admins:", error);
        }
    },

    async warnAdmin(sock, msg, analysis) {
        const groupJid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const userNumber = sender.split("@")[0];

        const categoryText =
            analysis.category === "Porn"
                ? "contenido explícito"
                : analysis.category === "Hentai"
                  ? "contenido inapropiado"
                  : "contenido sugestivo";

        const warnMsg = `Ey @${userNumber}, acabas de enviar ${categoryText}

Normalmente yo saco a la gente por esto, pero como eres admin solo te aviso. Sería bueno que cuides lo que compartes en el grupo aunque tengas permisos 😅

Detección: ${analysis.category} (${analysis.confidence}% confianza)`;

        await sock.sendMessage(groupJid, {
            text: warnMsg,
            mentions: [sender],
        });
    },

    async applyPunishment(sock, msg, analysis) {
        const groupJid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const userNumber = sender.split("@")[0];

        console.log("👤 Usuario:", userNumber);
        console.log("📊 Análisis:", {
            category: analysis.category,
            severity: analysis.severity,
            confidence: analysis.confidence
        });

        try {
            const warnings = await getGroupWarnings(groupJid, sender);
            const newWarnings = warnings + 1;
            

            await this.deleteMessage(sock, msg);

            if (
                analysis.severity === "high" ||
                newWarnings >= this.config.maxWarnings
            ) {
                console.log("   Razón: Severidad alta o límite alcanzado");
                await this.kickUser(sock, msg, sender, userNumber, analysis);
            } else {
                console.log(`   Quedan ${this.config.maxWarnings - newWarnings} oportunidades`);
                await this.warnUser(
                    sock,
                    msg,
                    sender,
                    userNumber,
                    newWarnings,
                    analysis,
                );
            }

            await updateGroupWarnings(groupJid, sender, newWarnings);
        } catch (error) {
            // console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            // console.error("❌ ERROR [applyPunishment]:", error.message);
            // console.error("📋 Stack:", error.stack);
            // console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }
    },

    async warnUser(sock, msg, sender, userNumber, warnings, analysis) {
        const remaining = this.config.maxWarnings - warnings;

        const categoryText =
            analysis.category === "Porn"
                ? "contenido explícito"
                : analysis.category === "Hentai"
                  ? "contenido inapropiado"
                  : "contenido sugestivo";

        let warningMsg;
        if (remaining === 1) {
            warningMsg = `Oye @${userNumber}, acabas de enviar ${categoryText} y eso no está permitido aquí.

✩ Ya llevas ${warnings} advertencia(s) de ${this.config.maxWarnings}
✩ Te queda solo UNA más antes de que te saque del grupo
✩ El contenido ya fue eliminado

En serio, la próxima vez que pase esto te vas directo afuera. Mantén el grupo limpio porfa 🙏`;
        } else {
            warningMsg = `Hey @${userNumber}, no envíes ${categoryText} por favor.

✩ Advertencia ${warnings} de ${this.config.maxWarnings}
✩ Te quedan ${remaining} oportunidades más
✩ Ya eliminé lo que enviaste

Cuida lo que compartes en el grupo, no queremos tener que sacarte 👀`;
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: warningMsg,
            mentions: [sender],
        });
    },

    async kickUser(sock, msg, sender, userNumber, analysis) {
        const categoryText =
            analysis.category === "Porn"
                ? "contenido explícito"
                : analysis.category === "Hentai"
                  ? "contenido inapropiado"
                  : "contenido sugestivo";

        let kickMsg;
        if (analysis.severity === "high") {
            kickMsg = `@${userNumber} ha sido expulsado del grupo.

Motivo: Envió ${categoryText} de gravedad alta
Confianza de detección: ${analysis.confidence}%

Este tipo de contenido no tiene ni una sola oportunidad aquí. Adiós 👋`;
        } else {
            kickMsg = `@${userNumber} alcanzó el límite de advertencias y ha sido expulsado.

Razón: Envío repetido de ${categoryText}
Última detección: ${analysis.confidence}% de confianza

Se le dio suficientes oportunidades pero no respetó las reglas del grupo 🚪`;
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: kickMsg,
            mentions: [sender],
        });

        await new Promise((resolve) =>
            setTimeout(resolve, this.config.kickDelay),
        );

        try {
            const response = await sock.groupParticipantsUpdate(
                msg.key.remoteJid,
                [sender],
                "remove",
            );

            if (response[0]?.status === "200") {
                console.log("✅ Usuario expulsado por contenido NSFW");
                await updateGroupWarnings(msg.key.remoteJid, sender, 0);
            }
        } catch (error) {
            // console.error("❌ Error expulsando usuario:", error);
        }
    },

    async deleteMessage(sock, msg) {
        await new Promise((resolve) =>
            setTimeout(resolve, this.config.deleteDelay),
        );

        try {
            await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
            console.log("🗑️ Contenido NSFW eliminado");
        } catch (error) {
            // console.error("❌ Error eliminando mensaje:", error);
        }
    },

    setSensitivity(level) {
        switch (level) {
            case "low":
                this.config.threshold = 0.8;
                this.config.strictMode = false;
                break;
            case "medium":
                this.config.threshold = 0.6;
                this.config.strictMode = false;
                break;
            case "high":
                this.config.threshold = 0.4;
                this.config.strictMode = true;
                break;
            default:
                this.config.threshold = 0.6;
                this.config.strictMode = false;
        }
        console.log(`🔧 Sensibilidad ajustada a: ${level}`);
    },

    getStats() {
        return {
            enabled: this.enabled,
            modelLoaded: !!this.model,
            threshold: this.config.threshold,
            strictMode: this.config.strictMode,
            maxWarnings: this.config.maxWarnings,
        };
    },
};

export default antinsfwEvent;
