import { getGroupSettings } from '../database/users.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import axios from 'axios';

const imageCache = new Map();
const lastRequestTime = { imgur: 0 };
const MIN_REQUEST_INTERVAL = 1000;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImageWithRetry(url, retries = 3) {
    if (imageCache.has(url)) {
        return imageCache.get(url);
    }
    for (let i = 0; i < retries; i++) {
        try {
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime.imgur;
            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
                await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
            }
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            lastRequestTime.imgur = Date.now();
            const buffer = Buffer.from(response.data);
            imageCache.set(url, buffer);
            return buffer;
        } catch (error) {
            if (error.response?.status === 429) {
                const waitTime = Math.pow(2, i) * 2000;
                console.log(`Rate limit alcanzado, esperando ${waitTime}ms antes de reintentar...`);
                await sleep(waitTime);
                continue;
            }
            if (i === retries - 1) throw error;
            await sleep(1000 * (i + 1));
        }
    }
    throw new Error('Máximo de reintentos alcanzado');
}

export const welcomeEvent = {
    name: 'welcome',
    enabled: true,
    async handleNewParticipants(sock, update) {
        const { id: groupId, participants, action } = update;
        try {
            if (action !== 'add')
                return;
            const settings = await getGroupSettings(groupId);
            if (!settings || !settings.welcome)
                return;
            const groupMetadata = await sock.groupMetadata(groupId);
            const groupName = groupMetadata.subject;
            for (const participant of participants) {
                const userNumber = participant.split('@')[0];
                const userName = await this.getUserName(sock, participant);
                try {
                    let profilePicUrl = 'https://i.imgur.com/whjlJSf.jpg';
                    try {
                        const picUrl = await sock.profilePictureUrl(participant, 'image');
                        if (picUrl)
                            profilePicUrl = picUrl;
                    }
                    catch {
                        profilePicUrl = 'https://i.imgur.com/whjlJSf.jpg';
                    }
                    const welcomeImage = await this.createWelcomeImage(userName, userNumber, groupName, profilePicUrl);
                    if (welcomeImage) {
                        await sock.sendMessage(groupId, {
                            image: welcomeImage,
                            caption: `《✧》 ¡Bienvenido/a @${userNumber}!\n\n` +
                                `Para ver los comandos disponibles, escribe: #help`,
                            mentions: [participant],
                            contextInfo: {
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: "120363421377964290@newsletter",
                                    newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                                    serverMessageId: 1,
                                },
                            }
                        });
                    }
                    else {
                        const welcomeMessage = this.createWelcomeMessage(userName, userNumber, groupName);
                        await sock.sendMessage(groupId, {
                            text: welcomeMessage,
                            mentions: [participant],
                            contextInfo: {
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: "120363421377964290@newsletter",
                                    newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                                    serverMessageId: 1,
                                },
                            }
                        });
                    }
                }
                catch (error) {
                    console.error('Error enviando mensaje de bienvenida:', error);
                    const welcomeMessage = this.createWelcomeMessage(userName, userNumber, groupName);
                    await sock.sendMessage(groupId, {
                        text: welcomeMessage,
                        mentions: [participant],
                        contextInfo: {
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363421377964290@newsletter",
                                newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                                serverMessageId: 1,
                            },
                        }
                    });
                }
                if (participants.length > 1) {
                    await sleep(2000);
                }
            }
        }
        catch (error) {
            console.error('Error en welcome event:', error);
        }
    },
    async createWelcomeImage(userName, userNumber, groupName, profilePicUrl) {
        try {
            const canvas = createCanvas(1200, 400);
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 1200, 400);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#f093fb');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1200, 400);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * 1200;
                const y = Math.random() * 400;
                const radius = Math.random() * 3 + 1;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, 1200, 400);
            try {
                const imageBuffer = await downloadImageWithRetry(profilePicUrl);
                const avatarImage = await loadImage(imageBuffer);
                ctx.save();
                ctx.beginPath();
                ctx.arc(200, 200, 120, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImage, 80, 80, 240, 240);
                ctx.restore();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(200, 200, 120, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(200, 200, 132, 0, Math.PI * 2);
                ctx.stroke();
            }
            catch (error) {
                console.error('Error cargando avatar:', error);
                ctx.fillStyle = '#667eea';
                ctx.beginPath();
                ctx.arc(200, 200, 120, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(200, 200, 120, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('¡BIENVENIDO!', 400, 120);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '45px "Segoe UI", Arial, sans-serif';
            const maxNameWidth = 700;
            let displayName = userName;
            let nameWidth = ctx.measureText(displayName).width;
            while (nameWidth > maxNameWidth && displayName.length > 0) {
                displayName = displayName.slice(0, -1);
                nameWidth = ctx.measureText(displayName + '...').width;
            }
            if (displayName !== userName) {
                displayName += '...';
            }
            ctx.fillText(displayName, 400, 190);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '35px "Segoe UI", Arial, sans-serif';
            ctx.fillText(`+${userNumber}`, 400, 250);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = 'italic 28px "Segoe UI", Arial, sans-serif';
            ctx.fillText('By DeltaByte', 400, 310);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 20, 1160, 360);
            return canvas.toBuffer('image/png');
        }
        catch (error) {
            console.error('Error creando imagen de bienvenida:', error);
            return null;
        }
    },
    createWelcomeMessage(userName, userNumber, groupName) {
        return `╔═════════════════════╗
║   ¡BIENVENIDO/A!   ║
╚═════════════════════╝

《✧》 Usuario: @${userNumber}
《✧》 Nombre: ${userName}
《✧》 Grupo: ${groupName}

━━━━━━━━━━━━━━━━━━━━━

¡Esperamos que disfrutes tu estadía aquí! 

Para ver los comandos disponibles, escribe:
#help

━━━━━━━━━━━━━━━━━━━━━

《✧》 Desarrollado por DeltaByte`;
    },
    async getUserName(sock, userId) {
        try {
            const contact = await sock.onWhatsApp(userId);
            if (contact && contact[0]?.notify) {
                return contact[0].notify;
            }
            return userId.split('@')[0];
        }
        catch (error) {
            return userId.split('@')[0];
        }
    },
    async handleParticipantLeft(sock, update) {
        const { id: groupId, participants, action } = update;
        try {
            if (action !== 'remove')
                return;
            const settings = await getGroupSettings(groupId);
            if (!settings || !settings.welcome)
                return;
            for (const participant of participants) {
                const userNumber = participant.split('@')[0];
                const userName = await this.getUserName(sock, participant);
                const goodbyeMessage = `╔═════════════════════╗
║      ADIÓS       ║
╚═════════════════════╝

@${userNumber} (${userName}) ha salido del grupo.

¡Hasta pronto!`;
                await sock.sendMessage(groupId, {
                    text: goodbyeMessage,
                    mentions: [participant],
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363421377964290@newsletter",
                            newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                            serverMessageId: 1,
                        },
                    }
                });
            }
        }
        catch (error) {
            console.error('Error en goodbye message:', error);
        }
    }
};
export default welcomeEvent;