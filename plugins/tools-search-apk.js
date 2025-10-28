import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const MAX_SIZE = 20 * 1024 * 1024
const apkCommand = {
    name: 'apk',
    aliases: ['aptoide'],
    category: 'tools',
    description: 'Busca y descarga APKs modificados desde Aptoide',
    usage: '#apk <nombre de la app> o #aptoide <nombre de la app>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        if (!args || args.length === 0) {
            await sock.sendMessage(chatId, {
                text: '《✧》 Por favor proporciona el nombre de la aplicación.\n\n*Ejemplo:* #apk proton vpn'
            }, { quoted: msg });
            return;
        }

        const query = args.join(' ')
        await sock.sendMessage(chatId, {
            text: `ᯓ★ Buscando *${query}* en Aptoide...`
        }, { quoted: msg })
        try {
            const searchUrl = `https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`
            const response = await axios.get(searchUrl, {
                timeout: 15000
            })

            if (!response.data || !response.data.datalist || !response.data.datalist.list || response.data.datalist.list.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '《✧》 No se encontraron resultados para tu búsqueda.'
                }, { quoted: msg })
                return
            }

            const app = response.data.datalist.list[0]
            const fileSize = app.file.filesize
            const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2)
            let infoText = `╭━━━━━━━━━━━━━━━━━╮\n`
            infoText += `┃  *${app.name}*\n`
            infoText += `╰━━━━━━━━━━━━━━━━━╯\n\n`
            infoText += `📦 *Paquete:* ${app.package}\n`
            infoText += `📊 *Versión:* ${app.file.vername}\n`
            infoText += `💾 *Tamaño:* ${fileSizeMB} MB\n`
            infoText += `⭐ *Rating:* ${app.stats.rating.avg} (${app.stats.rating.total} votos)\n`
            infoText += `📥 *Descargas:* ${app.stats.downloads.toLocaleString()}\n`
            infoText += `👤 *Desarrollador:* ${app.developer.name}\n`
            infoText += `🔒 *Seguridad:* ${app.file.malware.rank}\n\n`
            if (fileSize > MAX_SIZE) {
                infoText += `⚠️ *El archivo pesa ${fileSizeMB} MB y supera el límite de 20 MB.*\n\n`
                infoText += `🔗 *Descárgalo manualmente:*\n${app.file.path}`;
                await sock.sendMessage(chatId, {
                    text: infoText,
                    contextInfo: {
                        externalAdReply: {
                            title: app.name,
                            body: `${fileSizeMB} MB - ${app.file.vername}`,
                            thumbnailUrl: app.graphic || app.icon,
                            sourceUrl: app.file.path,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: msg });
                return;
            }

            infoText += `⏳ *Descargando APK...*`
            await sock.sendMessage(chatId, {
                text: infoText,
                contextInfo: {
                    externalAdReply: {
                        title: app.name,
                        body: `${fileSizeMB} MB - ${app.file.vername}`,
                        thumbnailUrl: app.graphic || app.icon,
                        sourceUrl: app.file.path,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg })
            const apkResponse = await axios.get(app.file.path, {
                responseType: 'arraybuffer',
                timeout: 60000,
                maxContentLength: MAX_SIZE,
                maxBodyLength: MAX_SIZE
            })

            const tempDir = path.join(__dirname, '../temp')
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const fileName = `${app.package}_${app.file.vername}.apk`
            const filePath = path.join(tempDir, fileName)
            fs.writeFileSync(filePath, Buffer.from(apkResponse.data))
            await sock.sendMessage(chatId, {
                document: fs.readFileSync(filePath),
                mimetype: 'application/vnd.android.package-archive',
                fileName: fileName,
                caption: `╭━━━━━━━━━━━━━━━━━╮\n┃  *${app.name}*\n╰━━━━━━━━━━━━━━━━━╯\n\n📦 ${app.package}\n📊 Versión: ${app.file.vername}\n💾 Tamaño: ${fileSizeMB} MB\n\n⚠️ *Instala bajo tu responsabilidad*`
            }, { quoted: msg })
            fs.unlinkSync(filePath)
        } catch (error) {
            console.error('Error en comando apk:', error)
            let errorMsg = '《✧》 Error al buscar o descargar la aplicación.'
            if (error.code === 'ECONNABORTED') {
                errorMsg = '《✧》 Tiempo de espera agotado. La descarga tardó demasiado.'
            } else if (error.response?.status === 404) {
                errorMsg = '《✧》 No se pudo encontrar el archivo APK.'
            } else if (error.message?.includes('maxContentLength')) {
                errorMsg = '《✧》 El archivo es demasiado grande para descargarse.'
            } await sock.sendMessage(chatId, {
                text: errorMsg
            }, { quoted: msg });
        }
    }
};

export default apkCommand;