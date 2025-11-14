import axios from 'axios'

const wikipediaCommand = {
    name: 'wikipedia',
    aliases: ['wiki', 'wp', 'wikip'],
    category: 'utils',
    description: 'Busca información en Wikipedia',
    usage: '#wikipedia [texto a buscar]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `*Ejemplos:*\n` +
                        `✿ #wikipedia inteligencia artificial\n` +
                        `✿ #wiki Albert Einstein\n` +
                        `✿ #wp Colombia`
                }, { quoted: msg });
            }
            const query = args.join(' ')
            const searchUrl = `https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`
            const searchResponse = await axios.get(searchUrl)
            const [, titles, , urls] = searchResponse.data
            if (!titles || titles.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `《✧》 No se encontraron resultados en Wikipedia para: "${query}"\n\n` +
                        `💡 *Tip:* Intenta con otros términos de búsqueda.`
                }, { quoted: msg })
            }

            const title = titles[0]
            const pageUrl = urls[0]
            const summaryUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
            const summaryResponse = await axios.get(summaryUrl)
            const pageData = summaryResponse.data
            let responseText = `《✧》 *Wikipedia*\n\n`
            responseText += `📚 *Título:* ${pageData.title}\n\n`
            const extract = pageData.extract.length > 500
                ? pageData.extract.substring(0, 500) + '...'
                : pageData.extract
            responseText += `${extract}\n\n`
            responseText += `🔗 *Leer más:* ${pageUrl}\n`
            responseText += `─────────────────\n`
            responseText += `_Información de Wikipedia_`
            const imageUrl = pageData.originalimage?.source || pageData.thumbnail?.source || null
            if (imageUrl) {
                try {
                    await sock.sendMessage(chatId, {
                        image: { url: imageUrl },
                        caption: responseText,
                        contextInfo: {
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363421377964290@newsletter",
                                newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                                serverMessageId: 1
                            }
                        }
                    }, { quoted: msg })
                } catch (imgSendError) {
                    console.error('Error enviando imagen:', imgSendError)
                    await sock.sendMessage(chatId, {
                        text: responseText,
                        contextInfo: {
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363421377964290@newsletter",
                                newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                                serverMessageId: 1
                            }
                        }
                    }, { quoted: msg })
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: responseText,
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363421377964290@newsletter",
                            newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                            serverMessageId: 1
                        }
                    }
                }, { quoted: msg })
            }
        } catch (error) {
            console.error('Error en comando wikipedia:', error);
            let errorMessage = '《✧》 Error al buscar en Wikipedia.'
            if (error.response?.status === 404) {
                errorMessage = `《✧》 No se encontró el artículo "${args.join(' ')}" en Wikipedia.`
            } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '《✧》 La búsqueda tardó demasiado. Intenta de nuevo.'
            } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
                errorMessage = '《✧》 Error de conexión. Verifica tu internet.'
            } await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\n💡 *Tip:* Verifica la ortografía o usa términos más específicos.`
            }, { quoted: msg })
        }
    }
}

export default wikipediaCommand