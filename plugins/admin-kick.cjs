// Utilidades
const digits = (s) => String(s || "").replace(/\D/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (jid) => String(jid || "").toLowerCase().replace(/:[^@]+@/, "@");

const kickCommand = {
    name: 'kick',
    aliases: ['expulsar', 'eliminar', 'echar', 'sacar', 'ban', 'remove'],
    category: 'group',
    description: 'Expulsa a uno o varios usuarios del grupo',
    usage: '#kick @usuario(s) o responder mensaje o escribir números',
    adminOnly: true,
    groupOnly: true,
    // NO ponemos botAdminRequired: true para evitar bloqueos previos
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        // 1) Metadata fresca
        let md;
        try { 
            md = await sock.groupMetadata(chatId); 
        } catch {
            return await sock.sendMessage(chatId, {
                text: "❌ *No pude leer la info del grupo.*"
            }, { quoted: msg });
        }

        const parts = md.participants || [];
        const roleByNorm = new Map(parts.map(p => [norm(p.id), p.admin || null]));
        const realByNorm = new Map(parts.map(p => [norm(p.id), p.id]));
        const inGroupSet = new Set(parts.map(p => norm(p.id)));

        const isAdminFresh = (jid) => {
            const r = roleByNorm.get(norm(jid));
            return r === "admin" || r === "superadmin";
        };

        // Verificar si el usuario es admin
        if (!isAdminFresh(sender)) {
            return await sock.sendMessage(chatId, {
                text: '⛔ *Solo administradores pueden usar este comando.*'
            }, { quoted: msg });
        }

        // 2) Targets (mención, reply, números en texto)
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
                      || msg.message?.contextInfo?.mentionedJid || [];
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant
                    || msg.message?.contextInfo?.participant || null;
        const text = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || "";
        const fromNums = (text.match(/\d{7,}/g) || []).map(n => `${digits(n)}@s.whatsapp.net`);

        let candidates = [...new Set([...(mentions || []), ...(quoted ? [quoted] : []), ...fromNums].filter(Boolean))];

        // 3) Normalizar → resolver JID real → dedupe
        candidates = candidates.map(j => norm(j));
        candidates = candidates.map(j => realByNorm.get(j) || j);
        candidates = [...new Set(candidates)];

        // 4) Filtrar: que estén en el grupo y no sea el bot
        const botIdNorm = norm(sock.user?.id);
        const targetsInGroup = candidates.filter(j => inGroupSet.has(norm(j)));
        let targets = targetsInGroup.filter(j => norm(j) !== botIdNorm);

        if (!targets.length) {
            return await sock.sendMessage(chatId, {
                text: "❌ *Debes mencionar, responder o escribir el número del usuario a expulsar.*"
            }, { quoted: msg });
        }

        // 5) Nunca eliminar admins: se protegen
        const protectedAdmins = [];
        const toRemove = [];
        for (const j of targets) {
            if (isAdminFresh(j)) protectedAdmins.push(j);
            else toRemove.push(j);
        }

        if (!toRemove.length) {
            const msgText = protectedAdmins.length
                ? `🛡️ *No puedo expulsar administradores.*\n${protectedAdmins.map(j => `• @${j.split("@")[0]}`).join("\n")}`
                : "❌ *No hay objetivos válidos para expulsar.*";
            return await sock.sendMessage(chatId, {
                text: msgText,
                mentions: protectedAdmins
            }, { quoted: msg });
        }

        // 6) Gate suave: probar con el primer objetivo si somos admin
        const probe = async (jid) => {
            try {
                await sock.groupParticipantsUpdate(chatId, [jid], "remove");
                await sleep(400);
                return true;
            } catch (e) {
                const code = e?.output?.statusCode || e?.status || e?.code;
                if (String(code) === "403" || String(code) === "401") {
                    const self = String(sock.user?.id || "").replace(/:[^@]+@/, "@");
                    const num = self.replace(/\D/g, "");
                    await sock.sendMessage(chatId, {
                        text: `❌ *Necesito ser administrador para expulsar usuarios.*\nHaz admin a este bot:\n• JID: ${self}\n• Número: +${num}`
                    }, { quoted: msg });
                    return false;
                }
                return "soft-error";
            }
        };

        const first = toRemove[0];
        const okProbe = await probe(first);
        if (okProbe === false) return;

        // 7) Expulsar 1×1 con verificación post-error
        const removed = [];
        const failed = [];
        const rest = toRemove;

        for (const t of rest) {
            try {
                await sock.groupParticipantsUpdate(chatId, [t], "remove");
                removed.push(t);
                await sleep(450);
            } catch (e) {
                const code = e?.output?.statusCode || e?.status || e?.code;

                // Verificar si, pese al error, ya no está en el grupo
                let stillIn = true;
                try {
                    const md2 = await sock.groupMetadata(chatId);
                    const nowSet = new Set((md2.participants || []).map(p => norm(p.id)));
                    stillIn = nowSet.has(norm(t));
                } catch {}

                if (!stillIn) {
                    if (!removed.includes(t)) removed.push(t);
                } else {
                    failed.push({ t, code, msg: e?.message });
                    console.error("[kick] remove error:", { target: t, code, msg: e?.message });
                }
                await sleep(450);
            }
        }

        // 8) Mensaje final
        let out = "";
        if (removed.length) out += `✅ *Expulsado(s):* ${removed.map(j => `@${j.split("@")[0]}`).join(", ")}\n`;
        if (protectedAdmins.length) out += `🛡️ *Protegidos (admins):* ${protectedAdmins.map(j => `@${j.split("@")[0]}`).join(", ")}\n`;
        if (failed.length) out += `❌ *Falló con:* ${failed.map(f => `@${f.t.split("@")[0]} (${f.code || "?"})`).join(", ")}\n`;

        await sock.sendMessage(chatId, {
            text: out.trim(),
            mentions: [...removed, ...protectedAdmins, ...failed.map(f => f.t)]
        }, { quoted: msg });
    }
};

export default kickCommand;