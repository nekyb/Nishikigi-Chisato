import config from '../config/bot.js';

const emoji = '📢';
const emoji2 = '👥';

const meetingCommand = {
    name: 'meeting',
    aliases: ['reunion'],
    category: 'owner',
    description: 'Envía una convocatoria de reunión a todos los owners',
    usage: '#meeting <motivo>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    ownerOnly: true,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: `${emoji} Por favor, ingresa el motivo de la reunión.`
            }, { quoted: msg });
        }
        if (text.length < 10) {
            return await sock.sendMessage(chatId, {
                text: `${emoji2} Por favor, ingresa al menos 10 caracteres.`
            }, { quoted: msg });
        }

        const senderNum = sender.split('@')[0].replace(/[^0-9]/g, '');
        const texto = `${emoji2} El Owner @${senderNum} ha empezado una reunión. Entra lo más pronto al grupo de staff...\n*➪ Motivo: ${text}*`;
        await sock.sendMessage(chatId, {
            text: `${emoji} Enviando mensaje de reunión a todos los owners.`
        }, { quoted: msg });

        const mentions = [sender];
        for (const owner of config.ownerNumbers) {
            const jid = owner.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (jid !== sender) {
                try {
                    await sock.sendMessage(jid, {
                        text: texto,
                        mentions
                    });
                } catch (err) {
                    console.error(`Error enviando a ${jid}:`, err.message);
                }
            }
        }
    }
};

export default meetingCommand;
