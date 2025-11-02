import dotenv from 'dotenv';
dotenv.config();
export const config = {
    botName: process.env.BOT_NAME || 'Nishikigi Chisato',
    prefix: process.env.PREFIX || '#',
    prefixes: process.env.PREFIXES ? process.env.PREFIXES.split(',') : ['#', '.', '?'],
    // ownerNumber kept for backward compatibility (first owner)
    ownerNumber: process.env.OWNER_NUMBER || '+170893057728762',
    // ownerNumbers: lista de owners admitidos (puede venir de OWNER_NUMBERS como CSV)
    ownerNumbers: (process.env.OWNER_NUMBERS ? process.env.OWNER_NUMBERS.split(',') : [process.env.OWNER_NUMBER || '+170893057728762', '+5755876966545']).map(n => {
        const v = String(n || '').trim();
        if (!v) return v;
        return v.startsWith('+') ? v : `+${v}`;
    }),
    commands: {
        adminOnly: ['kick', 'ban', 'change', 'tag'],
        ownerOnly: ['cambiarnombre', 'logs', 'off'],
        groupOnly: ['kick', 'ban', 'change', 'tag', 'alertas', 'antilink', 'welcome']
    },
    events: {
        alertas: true,
        antilink: false,
        welcome: true
    },
    messages: {
        notAdmin: '《✧》 Este comando solo puede ser usado por administradores.',
        notBotAdmin: '《✧》 Necesito ser administrador para ejecutar este comando.',
        notOwner: '《✧》 Este comando solo puede ser usado por el owner del bot.',
        notGroup: '《✧》 Este comando solo puede ser usado en grupos.',
        notRegistered: '《✧》 Necesitas estar registrado para usar el bot. Escribe cualquier mensaje para registrarte.',
        error: '《✧》 Ocurrió un error al ejecutar el comando.',
        processing: '《✧》 Procesando...',
        done: '《✧》 Comando ejecutado exitosamente.',
    },
    emojis: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳',
        admin: '👑',
        group: '👥',
        bot: '🤖'
    },
    links: {
        channel: 'https://whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p',
        commands: 'https://orcaleroo.vercel.app/#/commands',
        support: 'https://wa.me/573115434166'
    },
    images: {
        help: 'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/g1nh6c9tbyl.png',
        thumbnail: 'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/g1nh6c9tbyl.png'
    },
    permissions: {
        requireRegistration: true,
        allowBannedUsers: false
    },
    logs: {
        commands: true,
        events: true,
        errors: true,
        messages: false
    }
};
export function isOwner(number) {
    try {
        const cleanNumber = String(number).replace(/[^0-9]/g, '');
        const owners = Array.isArray(config.ownerNumbers) ? config.ownerNumbers : [config.ownerNumber];
        return owners.some(o => String(o).replace(/[^0-9]/g, '') === cleanNumber);
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
export default config;
