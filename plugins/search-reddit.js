import axios from 'axios'

const redditsearchCommand = {
    name: 'redditsearch',
    aliases: ['rs', 'reddit'],
    category: 'search',
    description: 'Busca posts en Reddit y devuelve los 5 primeros resultados.',
    usage: '#redditsearch [término]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 *Uso incorrecto del comando*\n\n' +
                        'Ejemplo:\n' +
                        '✿ #redditsearch mejores memes 2024'
                })
            }

            const query = args.join(' ')
            await sock.sendMessage(chatId, {
                text: '《✧》 Buscando en Reddit...'
            })

            const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5`
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'ManusAI-Bot/1.0' 
                },
                timeout: 15000
            })

            const posts = data.data.children
            if (posts.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '《✧》 No encontré posts en Reddit para tu búsqueda.'
                })
            }

            let responseText = `╔═══《 REDDIT SEARCH - ${query.toUpperCase()} 》═══╗\n`
            posts.forEach((post, i) => {
                const postData = post.data
                const title = postData.title
                const subreddit = postData.subreddit_name_prefixed
                const score = postData.score
                const link = `https://www.reddit.com${postData.permalink}`
                responseText += `║\n`
                responseText += `║ *${i + 1}. Título:* ${title}\n`
                responseText += `║   *Subreddit:* ${subreddit}\n`
                responseText += `║   *Score:* ${score}\n`
                responseText += `║   *Link:* ${link}\n`
            })
            responseText += `║\n╚══════════════════════════════════╝`
            await sock.sendMessage(chatId, {
                text: responseText
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en comando redditsearch:', error)
            await sock.sendMessage(chatId, {
                text: '《✧》 Error al realizar la búsqueda en Reddit.'
            })
        }
    }
}

export default redditsearchCommand