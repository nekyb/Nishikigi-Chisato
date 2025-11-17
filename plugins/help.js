import { config } from '../config/bot.js'

const helpCommand = {
    name: 'help',
    aliases: ['ayuda', 'comandos'],
    category: 'general',
    description: 'Muestra todos los comandos disponibles',
    usage: '.help',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid

        try {
            const helpText = `Hola, soy *Nishikigi Chisato*, soy un asistente personalizado, aquí tienes los comandos. ૮꒰ ˶• ༝ •˶꒱ა ♡

┌───◇◆◇───────────────┐
│ ✦ Developed by DeltaByte ⚡
│ ✦ Commands ➤ *${config.links.commands}*
│ ✦ Official Channel ➤ *${config.links.channel}*
│ ✦ Version ➤ *v2.2*
│ ✦ GitHub ➤ *${config.links.gitrepo}*
└─────────────────────┘

> *» ⟨⚜⟩ 𐌀𐌃ᛖ𐌆ᚢ𐌆𐌔𐌕ᚱ𐌀𐌂𐌆𐌏ᚢ ⟨⚜⟩*

✿ *#kick* + [ user ] 
╰⪼ Expulsa a un usuario del grupo.

✿ *#ban* + [ user ] 
╰⪼ Banea a un usuario del grupo.

✿ *#change* + [ description / name / image ] 
╰⪼ Cambia la descripción, nombre o imagen del grupo.

✿ *#alertas* + [ on / off ] 
╰⪼ Desactiva o activa las alertas del grupo.

✿ *#antilink* + [ on / off ] 
╰⪼ Desactiva o activa el antilink.

✿ *#welcome* + [ on / off ] 
╰⪼ Desactiva o activa la bienvenida.

✿ *#tag* + [ text ] 
╰⪼ Avisa algo a todos.

✿ *#tagall*
╰⪼ Lista y menciona a todos los miembros.

✿ *#autoadmin*
╰⪼ Sistema de auto-administración.

✿ *#porn* » *#nsfw* + [ on / off ]
╰⪼ Activa/desactiva comandos NSFW.

> *⟨⚜⟩ 𐌆ᚢ𐌅𐌏ᚱᛖ𐌀𐌂𐌆𐌏ᚢ ⟨⚜⟩*

✿ *#menu*
╰⪼ Menú con botones interactivos.

✿ *#botinfo*
╰⪼ Información del bot con botones.

✿ *#info*
╰⪼ Información general del bot.

✿ *#bansystem*
╰⪼ Sistema de baneos.

✿ *#getplugin* + [ nombre ]
╰⪼ Obtiene código de un plugin.

✿ *#addplugin*
╰⪼ Añade un nuevo plugin.

> *⟨⚜⟩ Ⳙ𐌕𐌆𐌋𐌆𐌃𐌀𐌃𐌄𐌔 ⟨⚜⟩*

✿ *#clima* + [ ciudad ] 
╰⪼ Muestra el clima de una ciudad.

✿ *#profile* » *#pfp* + [ @user ]
╰⪼ Muestra la foto de perfil de un usuario.

✿ *#letra* » *#song* + [ text ]
╰⪼ Busca la letra de una cancion.

✿ *#upload* » *#subir* + [ archivo ]
╰⪼ Sube un archivo a un servidor de una nube.

✿ *#removebg* » *#nobg* + [ image  ] 
╰⪼ Devuelve la imagen con transparencia.

✿ *#improve* » *#hd* + [ imagen ]
╰⪼ Mejora la calidad de una imagen.

✿ *#sticker* » *#s* + [ imagen ]
╰⪼ Convierte una imagen en sticker.

> *⟨⚜⟩ 𐌃𐌄𐌔𐌂𐌀ᚱᏵ𐌀𐌔 ⟨⚜⟩*

✿ *#mediafire* » *#mf* + [ enlace ]
╰⪼ Descarga archivos de MediaFire.

✿ *#facebook* » *#fb* + [ enlace ]
╰⪼ Descarga videos de Facebook.

✿ *#spotify* » *#sp* + [ enlace ]
╰⪼ Descarga canciones de Spotify.

✿ *#instagram* » *#ig* + [ link ]
╰⪼ Descarga un video o imagen de instagram.

✿ *#tiktok*  » *#ttk* + [ link ]
╰⪼ Descarga un video de TikTok.

✿ *#filedlname* + [ link ]
╰⪼ Descarga un archivo con un link directo.

✿ *#twidl*  » *#twitterdl* + [ link ]
╰⪼ Descarga un video de Twitter.

✿ *#imgdl*  » *#descargaimg* + [ link ]
╰⪼ Descarga una imagen a traves de un link directo.

> *⟨⚜⟩ 𐌔𐌄𐌀ᚱ𐌂ዞ ⟨⚜⟩*

✿ *#pin* » *#pinterest* + [ text ] 
╰⪼ Busca una imagen en Pinterest.

✿ *#ytmp4* + [ text ]
╰⪼ Busca un video en YouTube y lo descarga en formato mp4.

✿ *#font* » *#ttf* + [ nombre de la fuente ]
╰⪼ Busca y descarga fuentes tipográficas de DaFont.

✿ *#ttss* » *#tiktoks* + [ texto ]
╰⪼ Busca videos en TikTok.

✿ *#ping*  » *#p* 
╰⪼ Mira que tan rapido es el bot.

✿ *#wikipedia*  » *#wiki* + [ texto ]
╰⪼ Busca información en Wikipedia.

✿ *#google*  » *#ggl* + [ texto ]
╰⪼ Busca informacion en Google.

✿ *#apk* » *#aptoide* + [ texto ]
╰⪼ Busca una aplicacion modificada en Aptoide.

✿ *#ddg*  » *#duckgo* + [ texto ]
╰⪼ Busca informacion o algo en DuckDuckGo.

✿ *#brave*  » *#buscarb* + [ texto ]
╰⪼ Busca informacion en Brave.

✿ *#gimage* + [ texto ]
╰⪼ Busca una imagen en Google.

✿ *#redditsearch*  » *#rs* + [ texto ]
╰⪼ Busca un post en reddit.

✿ *#scsearch*  » *#sc* + [ texto ]
╰⪼ Busca una cancion en SoundCloud.

✿ *#github* + [ repositorio ]
╰⪼ Busca repositorios en GitHub.

✿ *#weather* » *#clima* + [ ciudad ]
╰⪼ Información del clima de una ciudad.

> *⟨⚜⟩ 𐌄𐌂𐌏ᚢ𐌏ᛖ𐌆𐌀 ⟨⚜⟩*

✿ *#work*  » *#w*
╰⪼ Trabaja para ganar coins.

✿ *#daily*
╰⪼ Reclama tu recompensa diaria.

✿ *#slut*
╰⪼ Trabaja vendiendo tu imagen para ganar coins.

✿ *#chess*
╰⪼ Una busqueda del tesoro :D

✿ *#crime*  » *#crimen*
╰⪼ Comete un crimen para ganar coins.

✿ *#rob*  » *#robar* + [ user ]
╰⪼ Roba coins a otro usuario.

✿ *#baltop*  » *#eboard* 
╰⪼ Mira el top 1 con mas coins.

✿ *#bank* » *#darcoins* + [ @user ] + [ cantidad ]
╰⪼ Gestión de banco y transferencias.

> *⟨⚜⟩ 𐐈Ⳙ𐌄Ᏽ𐌏𐌔 ⟨⚜⟩*

✿ *#carrera* 
╰⪼ ¿QUIEN ES EL MAS RAPIDO AQUI? >:v

✿ *#adivina* » *#guess*
╰⪼ Responde una adivinanza.

✿ *#math* » *#mates*
╰⪼ Resuelve una operacion matematica.

✿ *#topgays* » *#topotakus*
╰⪼ Haz un top de los mas Gays y Otakus del grupo.

✿ *#formarpareja* 
╰⪼ Forma una pareja en el grupo.

✿ *#ppt* » *#rockpaperscissors* + [ piedra / papel / tijera ]
╰⪼ Juega piedra, papel o tijera contra el bot.

✿ *#glx* 
╰⪼ Juega en el espacio, explora, mina, descubre.

✿ *#8ball* + [ pregunta ]
╰⪼ Bola 8 mágica con respuestas aleatorias.

✿ *#trivia*
╰⪼ Juego de preguntas y respuestas.

✿ *#tictactoe* » *#ttt*
╰⪼ Juega tres en raya.

✿ *#robotic* 
╰⪼ Juega Robotic Empire.

> *⟨⚜⟩ 𐌃𐌆ꓦ𐌄ᚱ𐌔𐌆𐌏ᚢ ⟨⚜⟩*

✿ *#meme* 
╰⪼ Muestra un meme aleatorio.

✿ *#cat* 
╰⪼ Imagen aleatoria de gatos.

✿ *#abrazar* + [ @user ]
╰⪼ Abraza a alguien.

✿ *#acariciar* + [ @user ]
╰⪼ Acaricia a alguien.

✿ *#kiss* + [ @user ]
╰⪼ Besa a alguien.

✿ *#slap* + [ @user ]
╰⪼ Abofetea a alguien.

✿ *#angry*
╰⪼ Muestra enojo.

✿ *#cry*
╰⪼ Llora.

✿ *#dance*
╰⪼ Baila.

✿ *#kill* + [ @user ]
╰⪼ Mata (roleplay).

✿ *#fumar*
╰⪼ Fuma (roleplay).

✿ *#seducir* + [ @user ]
╰⪼ Seduce a alguien.

✿ *#tijeras*
╰⪼ Tijeras (roleplay).

> *⟨⚜⟩ ᚢ𐌔𐌅Ⱎ ⟨⚜⟩*

✿ *#boobs* 
╰⪼ Mira fotos de tetas.

✿ *#hbikini*
╰⪼  Mira fotos hentai en bikini.

✿ *#porn* » *#nsfw* + [ on / off ]
╰⪼ Activa/desactiva modo NSFW.

✿ *#himg* » *#hentaimages*
╰⪼ Imagen hentai aleatoria.

✿ *#phdll* » *#pornhubdl* + [ url ]
╰⪼ Descarga videos de Pornhub.

✿ *#cojer* » *#blobjob*
╰⪼ Cojete a alguien.

> *⟨⚜⟩ Ᏽ𐌀𐌂ዞ𐌀 / ᚱ𐌓Ᏽ ⟨⚜⟩*

✿ *#rollwaifu*  » *#rw*
╰⪼ Personaje aleatorio del gacha

✿ *#claim*  » *#c* 
╰⪼ Reclama un personaje del gacha

✿ *#mywaifus*
╰⪼ Mira las waifus que has reclamado

✿ *#unlock* + [ user ]
╰⪼ Desbloquea la base de un usuario por 3 minutos

✿ *#listawaifus*
╰⪼ Mira la lista de waifus

✿ *#resetwaifus*
╰⪼ Restablece las waifus (Solo owner)

✿ *#topwaifus* + [ pagina ]
╰⪼ Muestra los top de mejores waifus

✿ *#wvideo* + [ nombfe de la waifu ]
╰⪼ Muestra un video aleatorio de un personaje

✿ *#wimage* + [ waifu ]
╰⪼ Muesta una imagen aleatoria de un personaje

✿ *#winfo* + [ waifu ]
╰⪼ Muestra la informacion de un personaje

✿ *#dar* + [ @user ] + [ waifu ]
╰⪼ Da una waifu a otro usuario.

✿ *#robarwaifu* + [ @user ]
╰⪼ Intenta robar una waifu de otro usuario.

✿ *#antirobo* + [ on / off ]
╰⪼ Protege tus waifus de robos.

> *⟨⚜⟩ 𐐈𐌀𐌃𐌆𐌁𐌏𐌕 ⟨⚜⟩*

✿ *#jadibot* » *#serbot*
╰⪼ Convierte tu número en un sub-bot.

✿ *#stopjadibot* » *#stop*
╰⪼ Detiene tu sub-bot.

✿ *#listbots* » *#bots*
╰⪼ Lista de bots activos.

> *⟨⚜⟩ ዞ𐌄ᚱᚱ𐌀ᛖ𐌆𐌄ᚢ𐌕𐌀𐌔 ⟨⚜⟩*

✿ *#lyrics* » *#letra* » *#lyric* + [ nombre de la canción ]
╰⪼ Busca la letra de una canción.

✿ *#shazam* » *#identificar* + [ cancion ]
╰⪼ Busca informacion sobre la cancion.

✿ *#news* + [ tema (opcional) ] 
╰⪼ Mira las noticias de ultima hora.

✿ *#qr* » *#qrcode* + [ texto ]
╰⪼ Genera códigos QR.

✿ *#shorturl* + [ url ]
╰⪼ Acorta URLs.

✿ *#calc* » *#calculate* + [ operación ]
╰⪼ Calculadora matemática.

✿ *#reverse* + [ texto ]
╰⪼ Invierte el texto.

✿ *#encode* » *#decode* + [ texto ]
╰⪼ Codifica/decodifica en Base64.

✿ *#translate* + [ idioma ] + [ texto ]
╰⪼ Traduce texto a otro idioma.

✿ *#pdf* + [ texto o imagen ]
╰⪼ Genera archivos PDF.

✿ *#fantasmas* » *#kickfantasmas*
╰⪼ Expulsa usuarios inactivos del grupo.

✿ *#fantasmasview*
╰⪼ Ver lista de usuarios inactivos.

> *⟨⚜⟩ 𐌆ᚢᚢ𐌏ꓦ𐌀𐌂𐌆𐌏ᚢ ⟨⚜⟩*

✿ *#genesis* » *#ai* + [ mensaje ]
╰⪼ Chat con IA avanzada.

✿ *#crypto* » *#coin* + [ moneda ]
╰⪼ Muestra el precio de una criptomoneda actualmente.

✿ *#speak* + [ texto ]
╰⪼ Genera un audio a partir de un texto.

✿ *#recordar* » *#reminder* + [ dia ] + [ hora ] + [ texto ]
╰⪼ Genesis te recordara los labores que pidas.

✿ *#vision* » *#analyze* » *#whatisthis* » *#describe* + [ imagen ] + [ pregunta ]
╰⪼ Analiza imágenes con IA y responde preguntas sobre ellas.

✿ *#blurface* + [ imagen ] 
╰⪼ Difumina rostros en imágenes usando IA.

✿ *#heygen* » *#genvideo* » *#texttovideo* » *#makevideo* + [ tu texto para el video ]
╰⪼ Genera videos con IA usando texto.

✿ *#codegen* » *#generatecode* + [ descripción ]
╰⪼ Genera código con IA.

✿ *#explaincode* + [ código ]
╰⪼ Explica código con IA.

✿ *#fixcode* + [ código ]
╰⪼ Corrige errores de código con IA.

✿ *#animeyou* + [ imagen ]
╰⪼ Convierte tu foto en estilo anime.

✿ *#deline* + [ imagen ]
╰⪼ Elimina líneas de una imagen.

✿ *#blur* + [ imagen ]
╰⪼ Difumina una imagen.

✿ *#elevenlabs* + [ texto ]
╰⪼ Text-to-speech avanzado con IA.

✿ *#translateadv* + [ idioma ] + [ texto ]
╰⪼ Traducción avanzada con IA.

━━━━━━━━━━━━━━━━━━━━━
_𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊_`

            console.log('📤 Enviando mensaje de ayuda...')

            await sock.sendMessage(chatId, {
                text: helpText,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363421377964290@newsletter",
                        newsletterName: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                        serverMessageId: 1,
                    },
                    externalAdReply: {
                        title: "Nιshιkιgι Chιsᥲto",
                        body: "𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊",
                        thumbnailUrl: "https://i.pinimg.com/1200x/ea/98/03/ea9803b311fc14143e48035b1eb935d0.jpg",
                        mediaType: 1,
                        sourceUrl: "https://whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p",
                        renderLargerThumbnail: true,
                    },
                },
            }, { quoted: msg })

            console.log('✅ Mensaje de ayuda enviado correctamente')

        } catch (error) {
            console.error('❌ Error en comando help:', error.message)
            console.error('Stack:', error.stack)

            // Detectar errores de conexión
            const isConnectionError = error.message?.includes('Connection Closed') || 
                                     error.message?.includes('Stream Errored') ||
                                     error.message?.includes('Timed Out') ||
                                     error.output?.statusCode === 428 ||
                                     error.output?.statusCode === 440;

            if (isConnectionError) {
                console.log('⚠️ Error de conexión detectado en help, esperando reconexión...')
                return;
            }

            // Intentar envío simple sin contextInfo
            try {
                console.log('📤 Intentando envío simplificado...')
                await sock.sendMessage(chatId, {
                    text: helpText
                }, { quoted: msg })

                console.log('✅ Mensaje simplificado enviado')
            } catch (simpleError) {
                console.error('❌ Error en envío simplificado:', simpleError.message)

                // Último intento: mensaje corto
                try {
                    await sock.sendMessage(chatId, {
                        text: `《✧》 *Comandos Principales*\n\n` +
                            `Admin: kick, ban, tag\n` +
                            `Downloads: tiktok, instagram, spotify\n` +
                            `Utilidad: clima, sticker, translate\n` +
                            `Juegos: roulette, ppt, trivia\n\n` +
                            `📖 Más info: ${config.links.commands}`
                    }, { quoted: msg })

                    console.log('✅ Mensaje corto enviado')
                } catch (fallbackError) {
                    console.error('❌ Error crítico en help:', fallbackError.message)
                }
            }
        }
    }
}

export default helpCommand