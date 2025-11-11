import dotenv from "dotenv";
dotenv.config();
export const config = {
    botName: process.env.BOT_NAME || "Nishikigi Chisato",
    prefix: process.env.PREFIX || "#",
    prefixes: process.env.PREFIXES
        ? process.env.PREFIXES.split(",")
        : ["#", ".", "?"],
    ownerNumber: process.env.OWNER_NUMBER || "+170893057728762",
    ownerNumbers: (process.env.OWNER_NUMBERS
        ? process.env.OWNER_NUMBERS.split(",")
        : [process.env.OWNER_NUMBER || "+170893057728762", "+5755876966545"]
    ).map((n) => {
        const v = String(n || "").trim();
        if (!v) return v;
        return v.startsWith("+") ? v : `+${v}`;
    }),
    commands: {
        adminOnly: ["kick", "ban", "change", "tag"],
        ownerOnly: ["cambiarnombre", "logs", "off"],
        groupOnly: [
            "kick",
            "ban",
            "change",
            "tag",
            "alertas",
            "antilink",
            "welcome",
        ],
    },
    events: {
        alertas: true,
        antilink: false,
        welcome: true,
    },
    messages: {
        notAdmin:
            "《✧》 Este comando solo puede ser usado por administradores.",
        notBotAdmin:
            "《✧》 Necesito ser administrador para ejecutar este comando.",
        notOwner:
            "《✧》 Este comando solo puede ser usado por el owner del bot.",
        notGroup: "《✧》 Este comando solo puede ser usado en grupos.",
        notRegistered:
            "《✧》 Necesitas estar registrado para usar el bot. Escribe cualquier mensaje para registrarte.",
        error: "《✧》 Ocurrió un error al ejecutar el comando.",
        processing: "《✧》 Procesando...",
        done: "《✧》 Comando ejecutado exitosamente.",
    },
    emojis: {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️",
        loading: "⏳",
        admin: "👑",
        group: "👥",
        bot: "🤖",
    },
    links: {
        channel: "https://whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p",
        commands: "https://orcaleroo.vercel.app/#/commands",
        support: "https://wa.me/573115434166",
    },
    images: {
        help: "https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/g1nh6c9tbyl.png",
        thumbnail:
            "https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/g1nh6c9tbyl.png",
        thumbnails: [
            "https://i.pinimg.com/1200x/89/23/4d/89234d800cabf0d96b20380a0a89cfec.jpg",
            "https://i.pinimg.com/1200x/ec/e3/b5/ece3b5d211b7841a11f37ba143b34879.jpg",
            "https://i.pinimg.com/1200x/35/30/f5/3530f5cb0d7c2c8213ad47822d196bfd.jpg",
            "https://i.pinimg.com/1200x/11/50/ed/1150ed6e7b0a66ca430e22db145b1b11.jpg",
            "https://i.pinimg.com/736x/3e/f2/ad/3ef2ad815176eca7eea447ca7e36be3a.jpg",
            "https://i.pinimg.com/1200x/b5/9a/e0/b59ae018049c3f7d055f95bdd10fa54a.jpg",
            "https://i.pinimg.com/1200x/13/0c/f6/130cf67ddaa8efbbcf7e69bfe3f75566.jpg",
            "https://i.pinimg.com/1200x/61/9b/e6/619be669648c4d96531b3d8332ec2d75.jpg",
            "https://i.pinimg.com/1200x/d8/87/db/d887db3bbd8602b6cf771caff5f7d117.jpg",
            "https://i.pinimg.com/736x/73/31/3e/73313e2f3bcaa135e70faf071cbe2f5a.jpg",
            "https://i.pinimg.com/736x/50/73/6c/50736c77fc80574107053c4de1ffcab2.jpg",
            "https://i.pinimg.com/736x/31/32/02/313202df546c117a97157f1442a76d67.jpg",
            "https://i.pinimg.com/736x/91/31/5c/91315c526e672bb749673a0775b95bf7.jpg",
            "https://i.pinimg.com/736x/e6/f3/e6/e6f3e6e700d0bdfe2b6912c3d5573c6c.jpg",
            "https://i.pinimg.com/1200x/f7/0f/38/f70f38ceb94a5c06e33f7ec9ae1e1e92.jpg",
            "https://i.pinimg.com/1200x/7f/79/7d/7f797dade8b15ec49216ccee0e5ec8be.jpg",
            "https://i.pinimg.com/1200x/a5/21/c4/a521c4d2b5bf12a93095caa41c911d37.jpg",
            "https://i.pinimg.com/736x/a8/7e/a0/a87ea0598fdaea90ac8417cba48ff96c.jpg",
            "https://i.pinimg.com/originals/ca/eb/40/caeb40cfca8c834716b1186cd384a949.png",
            "https://i.pinimg.com/originals/d1/f3/c1/d1f3c170741373271c1b192c67537541.jpg",
            "https://i.pinimg.com/1200x/27/f0/57/27f05711c65fe4f083b9227f88a17272.jpg"
        ],
    },
    externalAdReply: {
        title: "Nιshιkιgι Chιsᥲto",
        body: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
        mediaType: 1,
        sourceUrl: "https://whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p",
        renderLargerThumbnail: false,
    },
    permissions: {
        requireRegistration: true,
        allowBannedUsers: false,
    },
    logs: {
        commands: true,
        events: true,
        errors: true,
        messages: false,
    },
};
export function isOwner(number) {
    try {
        const cleanNumber = String(number).replace(/[^0-9]/g, "");
        const owners = Array.isArray(config.ownerNumbers)
            ? config.ownerNumbers
            : [config.ownerNumber];
        return owners.some(
            (o) => String(o).replace(/[^0-9]/g, "") === cleanNumber,
        );
    } catch (e) {
        return false;
    }
}
export function isOwnerCommand(command) {
    return config.commands.ownerOnly.includes(command);
}
export function isAdminCommand(command) {
    return config.commands.adminOnly.includes(command);
}
export function isGroupCommand(command) {
    return config.commands.groupOnly.includes(command);
}

export function getUsedPrefix(text) {
    for (const prefix of config.prefixes) {
        if (text.startsWith(prefix)) {
            return prefix;
        }
    }
    return null;
}

export function getRandomThumbnail() {
    const thumbnails = config.images.thumbnails;
    return thumbnails[Math.floor(Math.random() * thumbnails.length)];
}

export function getExternalAdReply() {
    return {
        ...config.externalAdReply,
        thumbnailUrl: getRandomThumbnail(),
    };
}

export default config;
