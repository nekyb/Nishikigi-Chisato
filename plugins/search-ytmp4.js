// Codigo creado por: PanDev

import axios from 'axios'
import yts from 'yt-search'

const MAX_FILE_SIZE = 280 * 1024 * 1024
const VIDEO_THRESHOLD = 70 * 1024 * 1024
const HEAVY_FILE_THRESHOLD = 100 * 1024 * 1024
const REQUEST_LIMIT = 3
const REQUEST_WINDOW_MS = 10000
const COOLDOWN_MS = 120000

const requestTimestamps = []
let isCooldown = false
let isProcessingHeavy = false

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'Desconocido'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  bytes = Number(bytes)
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(2)} ${units[i]}`
}

async function getSize(url) {
  try {
    const res = await axios.head(url, { timeout: 10000 })
    const size = parseInt(res.headers['content-length'], 10)
    if (!size) throw new Error('Tamaño no disponible')
    return size
  } catch {
    throw new Error('No se pudo obtener el tamaño del archivo')
  }
}

async function searchYouTube(query) {
  try {
    const searchResult = await yts.search({
      query: query,
      hl: 'es',
      gl: 'ES'
    })

    return searchResult.videos.map((video) => ({
      title: video.title,
      timestamp: video.timestamp,
      ago: video.ago,
      author: {
        name: video.author?.name || 'Desconocido'
      },
      url: video.url,
      image: video.image || video.thumbnail,
      videoId: video.videoId
    }))
  } catch (error) {
    console.error('Error buscando en YouTube con yt-search:', error)
    throw error
  }
}

// ⚡️ API 1: CloudKuTube
async function apiCloudKuTube(url) {
  const resolution = '360'
  const apiUrl = `https://cloudkutube.eu/api/ytv?url=${encodeURIComponent(url)}&resolution=${resolution}`
  const res = await axios.get(apiUrl, { timeout: 60000 })
  
  if (res.data.status !== 'success' || !res.data.result?.url) {
    throw new Error('CloudKuTube no devolvió datos válidos')
  }

  return {
    url: res.data.result.url,
    title: res.data.result.title || 'Video sin título'
  }
}

// ⚡️ API 2: MyApiAdonix (MP4)
async function apiAdonix(url) {
  let apiUrl = `https://myapiadonix.vercel.app/api/ytmp4?url=${encodeURIComponent(url)}`
  const res = await fetch(apiUrl, { timeout: 30000 })
  const text = await res.text()
  
  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    throw new Error('API Adonix devolvió respuesta inválida')
  }

  if (!data.status || !data.result?.url) {
    throw new Error('API Adonix no devolvió datos válidos')
  }

  return {
    url: data.result.url,
    title: data.result.title || 'Video sin título'
  }
}

// ⚡️ API 3: Fallback (ymcdn) - MP4
async function apiFallback(url) {
  const headers = {
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'sec-ch-ua': '"Chromium";v="132", "Not A(Brand";v="8"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    referer: 'https://id.ytmp3.mobi/',
    'referrer-policy': 'strict-origin-when-cross-origin'
  }

  const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*embed\/))([^&?/]+)/)?.[1]
  if (!videoId) throw new Error('ID de video no encontrado')

  const init = await (await fetch(`https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Date.now()}`, { headers })).json()
  const convert = await (await fetch(`${init.convertURL}&v=${videoId}&f=mp4&_=${Date.now()}`, { headers })).json()

  let info
  for (let i = 0; i < 5; i++) {
    const res = await fetch(convert.progressURL, { headers })
    info = await res.json()
    if (info.progress === 3) break
    await new Promise(r => setTimeout(r, 1500))
  }

  if (!info || !convert.downloadURL) throw new Error('API fallback no devolvió datos')
  return { url: convert.downloadURL, title: info.title || 'Video sin título' }
}

// 🎯 Gestor que intenta todas las APIs
async function ytdl(url) {
  const errors = []
  
  try {
    console.log('🔄 Intentando CloudKuTube...')
    return await apiCloudKuTube(url)
  } catch (e1) {
    errors.push(`CloudKuTube: ${e1.message}`)
    console.log('⚠️ CloudKuTube falló:', e1.message)
  }
  
  try {
    console.log('🔄 Intentando Adonix...')
    return await apiAdonix(url)
  } catch (e2) {
    errors.push(`Adonix: ${e2.message}`)
    console.log('⚠️ Adonix falló:', e2.message)
  }
  
  try {
    console.log('🔄 Intentando ymcdn fallback...')
    return await apiFallback(url)
  } catch (e3) {
    errors.push(`Fallback: ${e3.message}`)
    console.log('⚠️ Fallback falló:', e3.message)
  }
  
  throw new Error(`Todas las APIs fallaron:\n${errors.join('\n')}`)
}

function checkRequestLimit() {
  const now = Date.now()
  requestTimestamps.push(now)
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > REQUEST_WINDOW_MS) {
    requestTimestamps.shift()
  }
  if (requestTimestamps.length >= REQUEST_LIMIT) {
    isCooldown = true
    setTimeout(() => {
      isCooldown = false
      requestTimestamps.length = 0
    }, COOLDOWN_MS)
    return false
  }
  return true
}

const ytmp4Command = {
  name: 'ytmp4',
  aliases: ['play2', 'video', 'ytvideo', 'play'],
  category: 'downloads',
  description: 'Descarga videos de YouTube por texto',
  usage: '#ytmp4 [nombre del video]',
  adminOnly: false,
  groupOnly: false,
  botAdminRequired: false,
  
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid

    try {
      if (args.length === 0) {
        return await sock.sendMessage(chatId, {
          text: `╭─────────────────╮
│  🎬 *YOUTUBE DOWNLOADER*  │
╰─────────────────╯

📝 *Uso correcto:*
   #play [nombre del video]

📌 *Ejemplos:*
   • #play Ozuna - Caramelo
   • #play Música relajante
   • #video Tutoriales de programación

> _*By Soblend | Development Studio Creative*_`
        }, { quoted: msg })
      }

      if (isCooldown || !checkRequestLimit()) {
        return await sock.sendMessage(chatId, {
          text: `╭──────────╮
│  ⏳ *COOLDOWN*  │
╰──────────╯

Demasiadas solicitudes

⏱️ Espera 2 minutos antes de intentar nuevamente

> _*By Soblend | Development Studio Creative*_`
        }, { quoted: msg })
      }

      if (isProcessingHeavy) {
        return await sock.sendMessage(chatId, {
          text: `╭──────────╮
│  ⚠️ *OCUPADO*  │
╰──────────╯

Ya estoy procesando un archivo pesado

⏳ Espera un momento e intenta nuevamente

> _*By Soblend | Development Studio Creative*_`
        }, { quoted: msg })
      }

      const searchQuery = args.join(' ')

      await sock.sendMessage(chatId, {
        text: '🔍 Buscando en YouTube...'
      }, { quoted: msg })

      const searchResults = await searchYouTube(searchQuery)

      if (!searchResults || searchResults.length === 0) {
        return await sock.sendMessage(chatId, {
          text: `╭──────────╮
│  ❌ *SIN RESULTADOS*  │
╰──────────╯

No se encontraron videos para tu búsqueda

💡 Intenta con otro término de búsqueda

> _*By Soblend | Development Studio Creative*_`
        }, { quoted: msg })
      }

      const video = searchResults[0]

      const caption = `╭────────────────────╮
│  🎬 *YOUTUBE SEARCH*  │
╰────────────────────╯

✦ *Título:* ${video.title}
✦ *Duración:* ${video.timestamp}
✦ *Publicado:* ${video.ago}
✦ *Canal:* ${video.author.name}

✨ Elige una opción para descargar:

> _*By Soblend | Development Studio Creative*_`

      // Enviar mensaje con imagen y botones
      await sock.sendMessage(chatId, {
        image: { url: video.image },
        caption: caption,
        footer: "Genesis YouTube Downloader",
        buttons: [
          { 
            buttonId: `ytmp3 ${video.url}`, 
            buttonText: { displayText: "🎧 Audio MP3" }, 
            type: 1 
          },
          { 
            buttonId: `ytmp4 ${video.url}`, 
            buttonText: { displayText: "📽️ Video MP4" }, 
            type: 1 
          },
          { 
            buttonId: `ytmp3doc ${video.url}`, 
            buttonText: { displayText: "💿 Audio Doc" }, 
            type: 1 
          }
        ],
        headerType: 4
      }, { quoted: msg })

    } catch (error) {
      console.error('Error en comando ytmp4:', error)
      
      let errorMessage = `╭──────────╮
│  ⚠️ *ERROR*  │
╰──────────╯

Ocurrió un error inesperado`
      
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = `╭──────────╮
│  ⏱️ *TIMEOUT*  │
╰──────────╯

El video tardó demasiado en descargarse

💡 Intenta con un video más corto`
      } else if (error.response?.status === 404) {
        errorMessage = `╭──────────╮
│  🔧 *SERVICIO NO DISPONIBLE*  │
╰──────────╯

El servicio de descarga no está disponible

🔄 Intenta más tarde`
      } else if (error.message) {
        errorMessage = `╭──────────╮
│  ❌ *ERROR*  │
╰──────────╯

${error.message}`
      }

      await sock.sendMessage(chatId, {
        text: `${errorMessage}\n\n> _*By Soblend | Development Studio Creative*_`
      }, { quoted: msg })
    }
  }
}

export default ytmp4Command