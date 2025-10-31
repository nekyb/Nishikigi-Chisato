import { config } from '../config/bot.js'

const helpCommand = {
    name: 'help',
    aliases: ['ayuda', 'menu', 'comandos'],
    category: 'group',
    description: 'Muestra todos los comandos disponibles',
    usage: '#help',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            const helpText = `Hola, soy *Nishikigi Chisato*, soy un asistente personalizado, aquí tienes los comandos. ૮꒰ ˶• ༝ •˶꒱ა ♡

┌───◇◆◇───────────────┐
│ ✦ Developed by DeltaByte ⚡
│ ✦ Commands ➤ ${config.links.commands}
│ ✦ Official Channel ➤ ${config.links.channel}
└─────────────────────┘

» ⊹ ˚୨ •(=^●ω●^=)• Administración ⊹

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

» ⊹ ˚୨ •(=^●ω●^=)• Utilidades ⊹

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

» ⊹ ˚୨ •(=^●ω●^=)• Downloads ⊹

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

» ⊹ ˚୨ •(=^●ω●^=)• Search ⊹

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

✿ *#gis*  » *#googleimg* + [ texto ]
╰⪼ Busca una imagen en Google.

✿ *#redditsearch*  » *#rs* + [ texto ]
╰⪼ Busca un post en reddit.

✿ *#scsearch*  » *#sc* + [ texto ]
╰⪼ Busca una cancion en SoundCloud.

» ⊹ ˚୨ •(=^●ω●^=)• Economia ⊹

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
╰⪼ Mira el top 1 con mas coins

» ⊹ ˚୨ •(=^●ω●^=)• Gacha ⊹

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

» ⊹ ˚୨ •(=^●ω●^=)• Herramientas ⊹

✿ *#lyrics* » *#letra* » *#lyric* + [ nombre de la canción ]
╰⪼ Busca la letra de una canción.

✿ *#shazam* » *#identificar* + [ cancion ]
╰⪼ Busca informacion sobre la cancion.

» ⊹ ˚୨ •(=^●ω●^=)• Innovacion ⊹

✿ *#vision* » *#analyze* » *#whatisthis* » *#describe* + [ imagen ] + [ pregunta ]
╰⪼ Analiza imágenes con IA y responde preguntas sobre ellas.

✿ *#blurface* + [ imagen ] 
╰⪼ Difumina rostros en imágenes usando IA.

✿ *#heygen* » *#genvideo* » *#texttovideo* » *#makevideo* + [ tu texto para el video ]
╰⪼ Genera videos con IA usando texto.

━━━━━━━━━━━━━━━━━━━━━
_𝕻𝖔𝖜𝖊𝖗𝖊𝖉 𝕭𝐲 𝕯𝖊𝖑𝖙𝖆𝕭𝐲𝖙𝖊_`;
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
                        thumbnailUrl: "https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/zojhcalwil.jpg",
                        mediaType: 1,
                        sourceUrl: "https://whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p",
                        renderLargerThumbnail: true,
                    },
                },
            });
        }
        catch (error) {
            console.error('Error en comando help:', error);
            try {
                await sock.sendMessage(chatId, {
                    text: `❌ Error al cargar la imagen del menú.\n\nAquí están los comandos disponibles:\n\n` +
                        `*Comandos de Administración:*\n` +
                        `• ${config.prefix}kick @user - Expulsa a un usuario\n` +
                        `• ${config.prefix}ban @user - Banea a un usuario\n` +
                        `• ${config.prefix}change [option] - Cambia configuración del grupo\n` +
                        `• ${config.prefix}alertas [on/off] - Activa/desactiva alertas\n` +
                        `• ${config.prefix}antilink [on/off] - Activa/desactiva antilink\n` +
                        `• ${config.prefix}welcome [on/off] - Activa/desactiva bienvenida\n` +
                        `• ${config.prefix}tag [texto] - Etiqueta a todos\n\n` +
                        `Para más información, visita: ${config.links.commands}`
                });
            }
            catch (fallbackError) {
                console.error('Error enviando mensaje fallback:', fallbackError);
            }
        }
    }
};
export default helpCommand;