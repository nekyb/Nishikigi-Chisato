import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const soundcloudCommand = {
    name: 'soundcloud',
    aliases: [],
    category: 'tools',
    description: 'Busca y descarga canciones desde SoundCloud',
    usage: '#soundcloud <nombre de la canción>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const cid = msg.key.remoteJid

        if (!args || args.length === 0) {
            await sock.sendMessage(cid, {
                text: '《✧》 Por favor proporciona el nombre de la canción.\n\n*Ejemplo:* #soundcloud money lisa'
            }, { quoted: msg })
            return
        }

        const q = args.join(' ')

        await sock.sendMessage(cid, {
            react: { text: '⏳', key: msg.key }
        })

        try {
            const surl = `https://api.delirius.store/search/soundcloud?q=${encodeURIComponent(q)}`
            const s = await axios.get(surl, { timeout: 15000 })

            if (!s.data || !s.data.status || !s.data.data || s.data.data.length === 0) {
                await sock.sendMessage(cid, {
                    react: { text: '❌', key: msg.key }
                })
                await sock.sendMessage(cid, {
                    text: '《✧》 No se encontraron resultados para tu búsqueda.'
                }, { quoted: msg })
                return
            }

            const r = s.data.data[0]
            const link = r.link

            const durl = `https://api.delirius.store/download/soundcloud?url=${encodeURIComponent(link)}`
            const d = await axios.get(durl, { timeout: 15000 })

            if (!d.data || !d.data.status || !d.data.data) {
                await sock.sendMessage(cid, {
                    react: { text: '❌', key: msg.key }
                })
                await sock.sendMessage(cid, {
                    text: '《✧》 Error al obtener la información de la canción.'
                }, { quoted: msg })
                return
            }

            const data = d.data.data
            const min = Math.floor(data.duration / 60000)
            const sec = Math.floor((data.duration % 60000) / 1000)

            let txt = `╭━━━━━━━━━━━━━━━━━╮\n`
            txt += `┃  *${data.title}*\n`
            txt += `╰━━━━━━━━━━━━━━━━━╯\n\n`
            txt += `✦ *Autor:* ${data.author}\n`
            txt += `✦ *Duración:* ${min}:${sec.toString().padStart(2, '0')}\n`
            txt += `✦ *Likes:* ${data.likes.toLocaleString()}\n`
            txt += `✦ *Reproducciones:* ${data.playbacks.toLocaleString()}\n`
            txt += `✦ *Comentarios:* ${data.comments.toLocaleString()}\n`
            txt += `✦ *Reposts:* ${data.reposts.toLocaleString()}\n`
            txt += `✦ *Seguidores del autor:* ${data.followers.toLocaleString()}\n`
            txt += `✦ *Fecha:* ${new Date(data.created_at).toLocaleDateString()}\n\n`
            txt += `> _*⏳ *Descargando audio...*_`

            await sock.sendMessage(cid, {
                text: txt,
                contextInfo: {
                    externalAdReply: {
                        title: data.title,
                        body: `${data.author} - ${min}:${sec.toString().padStart(2, '0')}`,
                        thumbnailUrl: data.image,
                        sourceUrl: data.link,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg })

            const a = await axios.get(data.download, {
                responseType: 'arraybuffer',
                timeout: 60000
            })

            const tmp = path.join(__dirname, '../temp')
            if (!fs.existsSync(tmp)) {
                fs.mkdirSync(tmp, { recursive: true })
            }

            const fname = `${data.title.replace(/[^a-z0-9]/gi, '_')}.mp3`
            const fpath = path.join(tmp, fname)
            fs.writeFileSync(fpath, Buffer.from(a.data))

            await sock.sendMessage(cid, {
                audio: fs.readFileSync(fpath),
                mimetype: 'audio/mpeg',
                fileName: fname,
                contextInfo: {
                    externalAdReply: {
                        title: data.title,
                        body: data.author,
                        thumbnailUrl: data.image,
                        sourceUrl: data.link,
                        mediaType: 2,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg })

            await sock.sendMessage(cid, {
                react: { text: '✅', key: msg.key }
            })

            fs.unlinkSync(fpath)

        } catch (error) {
            console.error('Error en comando soundcloud:', error)
            
            await sock.sendMessage(cid, {
                react: { text: '❌', key: msg.key }
            })

            let err = '《✧》 Error al buscar o descargar la canción.'
            
            if (error.code === 'ECONNABORTED') {
                err = '《✧》 Tiempo de espera agotado. La descarga tardó demasiado.'
            } else if (error.response?.status === 404) {
                err = '《✧》 No se pudo encontrar la canción.'
            } else if (error.message?.includes('maxContentLength')) {
                err = '《✧》 El archivo es demasiado grande para descargarse.'
            }

            await sock.sendMessage(cid, {
                text: err
            }, { quoted: msg })
        }
    }
}

export default soundcloudCommand