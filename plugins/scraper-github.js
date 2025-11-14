import axios from 'axios';

export default {
    name: 'github',
    aliases: ['gh', 'ghuser', 'ghrepo'],
    category: 'scraper',
    description: 'Busca información de usuarios y repositorios en GitHub',
    usage: '#github [usuario/repo]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *GitHub Scraper*\n\n` +
                        `Uso:\n` +
                        `✿ #github [usuario] - Info de usuario\n` +
                        `✿ #github [usuario/repo] - Info de repositorio\n\n` +
                        `Ejemplos:\n` +
                        `• #github nekyb\n` +
                        `• #github facebook/react`
                });
            }

            const query = args[0];

            if (query.includes('/')) {
                const [owner, repo] = query.split('/');
                await m.react('🕒');
                const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
                const data = response.data;
                await m.react('✨');
                await sock.sendMessage(chatId, {
                    text: `《✧》 *GitHub Repository*\n\n` +
                        `✦ *${data.full_name}*\n\n` +
                        `✦ *Descripción:*\n${data.description || 'Sin descripción'}\n\n` +
                        `✦ Stars: ${data.stargazers_count.toLocaleString()}\n` +
                        `✦ Forks: ${data.forks_count.toLocaleString()}\n` +
                        `✦ Watchers: ${data.watchers_count.toLocaleString()}\n` +
                        `✦ Issues: ${data.open_issues_count}\n\n` +
                        `✦ Creado: ${new Date(data.created_at).toLocaleDateString()}\n` +
                        `✦ Actualizado: ${new Date(data.updated_at).toLocaleDateString()}\n\n` +
                        `✦ Lenguaje: ${data.language || 'N/A'}\n` +
                        `✦ Licencia: ${data.license?.name || 'N/A'}\n\n` +
                        `✦ ${data.html_url}`
                }, { quoted: msg });

            } else {
                const response = await axios.get(`https://api.github.com/users/${query}`);
                const data = response.data;

                await sock.sendMessage(chatId, {
                    image: { url: data.avatar_url },
                    caption: `《✧》 *GitHub User*\n\n` +
                        `✦ *${data.login}*\n` +
                        `${data.name ? `✦ ${data.name}\n` : ''}` +
                        `${data.bio ? `✦ ${data.bio}\n` : ''}\n` +
                        `✦ Followers: ${data.followers.toLocaleString()}\n` +
                        `✦ Following: ${data.following.toLocaleString()}\n` +
                        `✦ Repos públicos: ${data.public_repos}\n\n` +
                        `${data.company ? `✦ ${data.company}\n` : ''}` +
                        `${data.location ? `✦ ${data.location}\n` : ''}` +
                        `${data.blog ? `🔗 ${data.blog}\n` : ''}` +
                        `${data.twitter_username ? `✦ @${data.twitter_username}\n` : ''}\n` +
                        `✦ Cuenta creada: ${new Date(data.created_at).toLocaleDateString()}\n\n` +
                        `✦ ${data.html_url}`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error en github:', error);
            
            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: '《✧》 ❌ Usuario o repositorio no encontrado.'
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✧》 ❌ Error al buscar en GitHub.\n\n` +
                        `Verifica que el nombre sea correcto.`
                });
            }
        }
    }
};
