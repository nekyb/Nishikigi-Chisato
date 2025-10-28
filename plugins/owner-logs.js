import { getAllUsers, countUsers } from '../database/users.js';
import moment from 'moment-timezone';
const logsCommand = {
    name: 'logs',
    aliases: ['stats', 'estadisticas', 'info'],
    category: 'owner',
    description: 'Muestra estadísticas del bot',
    usage: '#logs [users/recent/system]',
    ownerOnly: true,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            const option = args[0]?.toLowerCase() || 'system';
            switch (option) {
                case 'users':
                case 'usuarios':
                    await showUsersLogs(sock, chatId);
                    break;
                case 'recent':
                case 'recientes':
                    await showRecentUsers(sock, chatId);
                    break;
                case 'system':
                case 'sistema':
                default:
                    await showSystemLogs(sock, chatId);
                    break;
            }
        }
        catch (error) {
            console.error('Error en comando logs:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Ocurrió un error al obtener los logs'
            });
        }
    }
};
async function showSystemLogs(sock, chatId) {
    try {
        const botNumber = sock.user.id.split(':')[0];
        const botName = sock.user.name || 'Orcalero Orcala 2.0';
        const totalUsers = await countUsers();
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const memoryUsage = process.memoryUsage();
        const memoryMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memoryTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
        const now = moment().tz('America/Bogota').format('DD/MM/YYYY HH:mm:ss');
        const logsText = `╔══════════════════════╗
║    LOGS DEL SISTEMA   ║
╚══════════════════════╝

🤖 *Información del Bot:*
├ Nombre: ${botName}
├ Número: ${botNumber}
└ Versión: 2.0

👥 *Usuarios:*
└ Total registrados: ${totalUsers}

⏱️ *Uptime:*
└ ${hours}h ${minutes}m ${seconds}s

💾 *Memoria:*
├ Uso: ${memoryMB} MB
└ Total: ${memoryTotal} MB

🌐 *Sistema:*
├ Node: ${process.version}
├ Plataforma: ${process.platform}
└ PID: ${process.pid}

📅 *Fecha:*
└ ${now} (COT)

━━━━━━━━━━━━━━━━━━━━━
_Usa #logs users para ver usuarios_
_Usa #logs recent para ver últimos registros_`;
        await sock.sendMessage(chatId, {
            text: logsText
        });
    }
    catch (error) {
        console.error('Error mostrando logs del sistema:', error);
        throw error;
    }
}
async function showUsersLogs(sock, chatId) {
    try {
        const totalUsers = await countUsers();
        const users = await getAllUsers();
        let usersText = `╔═══════════════════════╗
║   👥 USUARIOS REGISTRADOS   ║
╚═══════════════════════╝

📊 *Total: ${totalUsers} usuarios*

━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (users.length === 0) {
            usersText += 'No hay usuarios registrados aún.';
        }
        else {
            const displayUsers = users.slice(0, 20);
            displayUsers.forEach((user, index) => {
                const registeredDate = moment(user.registered_at).tz('America/Bogota').format('DD/MM/YY HH:mm');
                const status = user.is_banned ? '🚫' : '✅';
                usersText += `${index + 1}. ${status} *${user.name}*\n`;
                usersText += `   └ ID: ${user.user_id}\n`;
                usersText += `   └ Registro: ${registeredDate}\n\n`;
            });
            if (users.length > 20) {
                usersText += `\n_... y ${users.length - 20} usuarios más_`;
            }
        }
        usersText += `\n━━━━━━━━━━━━━━━━━━━━━\n_✅ = Activo | 🚫 = Baneado_`;
        await sock.sendMessage(chatId, {
            text: usersText
        });
    }
    catch (error) {
        console.error('Error mostrando logs de usuarios:', error);
        throw error;
    }
}
async function showRecentUsers(sock, chatId) {
    try {
        const users = await getAllUsers();
        let recentText = `╔═══════════════════════╗
║   🆕 USUARIOS RECIENTES   ║
╚═══════════════════════╝

━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (users.length === 0) {
            recentText += 'No hay usuarios registrados aún.';
        }
        else {
            const recentUsers = users.slice(0, 10);
            recentUsers.forEach((user, index) => {
                const registeredDate = moment(user.registered_at).tz('America/Bogota').format('DD/MM/YY HH:mm');
                const timeAgo = moment(user.registered_at).fromNow();
                recentText += `${index + 1}. *${user.name}*\n`;
                recentText += `   └ ID: ${user.user_id}\n`;
                recentText += `   └ Hace: ${timeAgo}\n`;
                recentText += `   └ Fecha: ${registeredDate}\n\n`;
            });
        }
        recentText += `\n━━━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(chatId, {
            text: recentText
        });
    }
    catch (error) {
        console.error('Error mostrando usuarios recientes:', error);
        throw error;
    }
}
export default logsCommand;