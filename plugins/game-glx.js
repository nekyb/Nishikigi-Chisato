// GALAXIA GAME - By https://github.com/jeffersonalionco
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const databasePath = join(__dirname, '../database/glx/database.json')
const templatePath = join(__dirname, '../database/template.json')

// Cachés para metadatos de grupos
const groupMetadataCache = new Map()

// Crear base de datos si no existe
async function createDatabase() {
    try {
        await fs.access(databasePath)
    } catch (error) {
        if (error.code === 'ENOENT') {
            const template = await fs.readFile(templatePath, 'utf-8')
            await fs.writeFile(databasePath, template)
            console.log('Archivo database.json creado exitosamente.')
        }
    }
}

// Cargar base de datos
async function loadDatabase() {
    try {
        const data = await fs.readFile(databasePath, 'utf-8')
        const parsed = JSON.parse(data)
        // Si el archivo contiene un array vacío o está mal formado, reemplazar con la plantilla
        if (!parsed || Array.isArray(parsed)) {
            const template = await fs.readFile(templatePath, 'utf-8')
            const tplObj = JSON.parse(template)
            await fs.writeFile(databasePath, JSON.stringify(tplObj, null, 2))
            return tplObj
        }
        return parsed
    } catch (err) {
        // Si hay cualquier error leyendo/parsing, recuperar la plantilla
        const template = await fs.readFile(templatePath, 'utf-8')
        const tplObj = JSON.parse(template)
        await fs.writeFile(databasePath, JSON.stringify(tplObj, null, 2))
        return tplObj
    }
}

// Guardar base de datos
async function saveDatabase(db) {
    await fs.writeFile(databasePath, JSON.stringify(db, null, 2))
}

// Generar número aleatorio
function randomNumber(max, min) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// Formatear valor monetario
function formatValue(valor, idioma, currency) {
    return valor.toLocaleString(idioma, { style: 'currency', currency: currency })
}

const galaxiaCommand = {
    name: 'glx',
    aliases: ['gameglx'],
    category: 'game',
    description: 'Juego de la Galaxia - Explora, mina y combate',
    usage: '#glx [opción]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        
        try {
            // Crear base de datos si no existe
            await createDatabase()
            
            // Cargar datos
            const db = await loadDatabase()
            // Resolver usuario por número para evitar problemas con sufijos del JID
            db.users = db.users || {}
            const senderNumber = String(sender).split('@')[0]
            const existingKey = Object.keys(db.users).find(k => k && k.split('@')[0] === senderNumber)
            const userKey = existingKey || sender

            if (!db.users[userKey]) {
                // Crear datos por defecto para el usuario
                db.users[userKey] = {
                    gameglx: {
                        status: false,
                        perfil: {
                            nome: msg.pushName || '',
                            id: userKey,
                            carteira: { balance: 0, currency: db.planetas?.terra?.idpelonome || 'GLX' },
                            casa: {
                                id: db.planetas?.terra?.id || null,
                                planeta: db.planetas?.terra?.nomeplaneta || 'Terra',
                                colonia: {
                                    nome: db.planetas?.terra?.colonias?.colonia1?.nome || 'Colonia',
                                    id: db.planetas?.terra?.colonias?.colonia1?.id || null
                                },
                                idpelonome: db.planetas?.terra?.idpelonome || 'terra'
                            },
                            localizacao: { status: false, nomeplaneta: '', id: null, idpelonome: '' },
                            xp: 0,
                            nivel: { nome: 'Novato', proximoNivel: 1 },
                            poder: 1,
                            ataque: { forcaAtaque: { ataque: 1 } },
                            defesa: { forca: 1 },
                            username: '',
                            nave: { nome: null }
                        }
                    }
                }
                await saveDatabase(db)
            }
            const userData = db.users[userKey].gameglx
            
            // Si no hay argumentos, mostrar menú principal
            if (args.length === 0) {
                return await showMainMenu(sock, msg, userData)
            }
            
            const command = args[0].toLowerCase()
            
            // Si el usuario no está registrado, solo permitir el comando cadastrar
            if (!userData.status && command !== 'cadastrar') {
                return await sock.sendMessage(chatId, {
                    text: `😢 Necesitas registrarte en el juego\n\n> Usa *#glx cadastrar*\n_Para registrarte._\n\n😁 *regístrate ahora, no pierdas tiempo.*`
                }, { quoted: msg })
            }
            
            // Manejar comandos
            switch (command) {
                case 'cadastrar':
                    await handleRegister(sock, msg, userData, db)
                    break
                    
                case 'perfil':
                    await handleProfile(sock, msg, userData, db)
                    break
                    
                case 'carteira':
                    await handleWallet(sock, msg, userData)
                    break
                    
                case 'miner':
                    await handleMining(sock, msg, args, userData, db)
                    break
                    
                case 'vender':
                    await handleSell(sock, msg, args, userData, db)
                    break
                    
                case 'bau':
                case 'bolsa':
                    await handleInventory(sock, msg, userData)
                    break
                    
                case 'loja':
                case 'comprar':
                    await handleShop(sock, msg, args, userData, db)
                    break
                    
                case 'viajar':
                    await handleTravel(sock, msg, args, userData, db)
                    break
                    
                case 'planeta':
                    await handlePlanet(sock, msg, args, userData, db)
                    break
                    
                case 'atacar':
                    await handleAttack(sock, msg, args, userData, db)
                    break
                    
                case 'set':
                    await handleSettings(sock, msg, args, userData, db)
                    break
                    
                case 'criador':
                    await sock.sendMessage(sender, {
                        text: `🛈 *INFORMACIÓN SOBRE EL CREADOR:*\n\n👨 *_creador del juego galaxia:_*\nhttps://github.com/jeffersonalionco\n\n👨 *_Creador del BOT:_*\nhttps://github.com/BrunoSobrino`
                    }, { quoted: msg })
                    break
                    
                case 'sobre':
                    await handleAbout(sock, msg)
                    break
                    
                default:
                    await sock.sendMessage(chatId, {
                        text: `*[!]* La opción *${command}* no existe!`
                    }, { quoted: msg })
            }
            
        } catch (error) {
            console.log('Error en comando GLX:', error)
            await sock.sendMessage(chatId, {
                text: '❌ Ocurrió un error al procesar el comando.'
            }, { quoted: msg })
        }
    }
}

// Mostrar menú principal
async function showMainMenu(sock, msg, userData) {
    const chatId = msg.key.remoteJid
    
    const menuText = `*╔═ 🪐JUEGO DE GALAXIA🪐 ═╗*

👨‍🚀 Hola *${msg.pushName}*, Es la hora de viajar por el espacio, mina asteroides, conversa con alienígenas y mucho más en el mundo galáctico!

💰 Moneda: ${userData.perfil.carteira.currency}

*🌠 #glx cadastrar*
_Para registrarse en la GLX_

*🌠 #glx perfil*
_Mira la evolución de tu perfil._

*🌠 #glx vender*
_vende tus objetos del cofre._

> 🧾 Ataques / Defensa / Viajar

*🌠 #glx atacar list*
_Enlista todos los jugadores del juego!_

*🌠 #glx atacar <username>*
_ataca a un usuario usando su username!_

*🌠 #glx planeta*
_Actualizar datos Planeta y Colonia_

*🌠 #glx viajar*
_¿Quieres visitar otro Planeta? Vamos!_

> 🧾 Opciones de minería

*🌠 #glx miner*
_Quieres dinero? Vamos a minar._

> 🧾 Tu información personal 

*🌠 #glx carteira*
_Accede a tu billetera financiera._

*🌠 #glx loja*
_Descubre nuestra tienda de la galaxia_

*🌠 #glx bau*
_Mira tus items guardados_

*🌟 #glx criador*
_Información del creador del juego._

*🌟 #glx sobre*
_Sobre el juego._

*╘═══════════════════╛*
🌞🌕🌠🌟⭐🌎🪐`
    
    try {
        const imagePath = join(__dirname, '../src/assets/images/menu/main/galaxiaMenu.png')
        await sock.sendMessage(chatId, {
            image: { url: imagePath },
            caption: menuText
        }, { quoted: msg })
    } catch (error) {
        await sock.sendMessage(chatId, {
            text: menuText
        }, { quoted: msg })
    }
}

// Manejar registro
async function handleRegister(sock, msg, userData, db) {
    const sender = msg.key.participant || msg.key.remoteJid
    const chatId = msg.key.remoteJid
    
    if (userData.status) {
        return await sock.sendMessage(chatId, {
            text: `😁 Hola *${msg.pushName}*, Ya estás registrado.`
        }, { quoted: msg })
    }
    
    // Activar registro
    userData.status = true
    userData.perfil.nome = msg.pushName
    userData.perfil.id = sender
    
    // Configurar casa en la Tierra (accesos seguros)
    const terra = (db.planetas && db.planetas.terra) ? db.planetas.terra : {
        id: null,
        nomeplaneta: 'Terra',
        idpelonome: 'terra',
        colonias: { colonia1: { id: null, nome: 'Colonia Principal', habitantes: [] } },
        habitantes: []
    }
    userData.perfil.casa.id = terra.id || null
    userData.perfil.casa.planeta = terra.nomeplaneta || 'Terra'
    userData.perfil.casa.colonia.nome = terra.colonias?.colonia1?.nome || 'Colonia Principal'
    userData.perfil.casa.colonia.id = terra.colonias?.colonia1?.id || null
    userData.perfil.casa.idpelonome = terra.idpelonome || 'terra'
    
    // Configurar localización
    userData.perfil.localizacao.status = true
    userData.perfil.localizacao.nomeplaneta = terra.nomeplaneta || 'Terra'
    userData.perfil.localizacao.id = terra.id || null
    userData.perfil.localizacao.idpelonome = terra.idpelonome || 'terra'
    
    // Generar username único
    const randomNum = randomNumber(3000, 1)
    userData.perfil.username = `user${randomNum}`
    
    // Agregar a la base de datos (asegurar estructuras)
    db.user_cadastrado = db.user_cadastrado || { lista: [], username: [] }
    db.planetas = db.planetas || {}
    db.planetas.terra = db.planetas.terra || terra
    db.planetas.terra.habitantes = db.planetas.terra.habitantes || []
    db.planetas.terra.colonias = db.planetas.terra.colonias || { colonia1: { habitantes: [], nome: 'Colonia Principal', id: null } }
    db.planetas.terra.colonias.colonia1.habitantes = db.planetas.terra.colonias.colonia1.habitantes || []

    if (!db.user_cadastrado.lista.includes(sender)) {
        db.planetas.terra.habitantes.push(sender)
        db.planetas.terra.colonias.colonia1.habitantes.push(sender)
        db.user_cadastrado.lista.push(sender)
        db.user_cadastrado.username.push({ id: sender, username: userData.perfil.username })
        await saveDatabase(db)
    }
    
    const registerText = `*_⚔️ AHORA ERES UN MIEMBRO ESTELAR🪐_*

Tu información en la galaxia!

*🧑Nombre: _${msg.pushName}_*
*🌐Username: _${userData.perfil.username}_*
*⏹️Estado: _Activo_*
*🚀Tiene nave: _No_*

\`\`\`🏠 Donde vives ahora?:\`\`\`
*🪐Tu planeta: _${userData.perfil.casa.planeta}_*
*🏠Colonia: _${userData.perfil.casa.colonia.nome}_*

Comandos de Configuración:
*#glx set name* - nombre
*#glx set username* - username

Comandos Glx en Grupos(planeta):
*#glx planeta act* - Actualiza datos de la colonia.

╔════════════════════╗

*_⚙️ TODOS LOS COMANDOS_*
Use: #glx

╚════════════════════╝

*_🛸 JUEGO DE LA GALAXIA 🛸_*`
    
    await sock.sendMessage(chatId, {
        text: registerText
    }, { quoted: msg })
}

// Manejar perfil
async function handleProfile(sock, msg, userData, db) {
    const sender = msg.key.participant || msg.key.remoteJid
    const nave = userData.perfil.nave.nome || 'No tiene nave'
    
    const profileText = `*_🤖 ${userData.perfil.nome} Su Perfil!_*

Esta es tu información en el juego \`\`\`GALAXIA\`\`\`.

_💡No olvides minar, *#glx miner* Esto aumenta tu XP y fuerza._

*🆙 XP:* _${userData.perfil.xp} XP_
    *Próximo Nivel:* _${db.api.niveis[`nivel${userData.perfil.nivel.proximoNivel}`].totalXp} XP_

*📈 Nivel:* _${userData.perfil.nivel.nome}_
*💪 Poder [Fuerza]:* _${userData.perfil.poder}_ P
*⚔️ Poder Ataque:* _${userData.perfil.ataque.forcaAtaque.ataque}_ P
*🛡️ Poder Defesa:* _${userData.perfil.defesa.forca}_ P
*🌀 Username:* _${userData.perfil.username}_

*🗣️ Idioma:* _${userData.perfil.idioma}_
*💰 Moneda:* _${userData.perfil.carteira.currency}_

*🌏 Planeta:* _${userData.perfil.casa.planeta}_
*🏠 Colonia:* _${userData.perfil.casa.colonia.nome}_

*🛸 Su nave actual:* _${nave}_

*_⚙️ TODOS LOS COMANDOS_*
Use: #glx`
    
    try {
        const profileImage = join(__dirname, '../src/assets/glx/perfil.png')
        await sock.sendMessage(sender, {
            image: { url: profileImage },
            caption: profileText
        }, { quoted: msg })
    } catch (error) {
        await sock.sendMessage(sender, {
            text: profileText
        }, { quoted: msg })
    }
}

// Funciones auxiliares adicionales (simplificadas)
async function handleWallet(sock, msg, userData) {
    // Implementar billetera
}

async function handleMining(sock, msg, args, userData, db) {
    // Implementar minería
}

async function handleSell(sock, msg, args, userData, db) {
    // Implementar venta
}

async function handleInventory(sock, msg, userData) {
    // Implementar inventario
}

async function handleShop(sock, msg, args, userData, db) {
    // Implementar tienda
}

async function handleTravel(sock, msg, args, userData, db) {
    // Implementar viajes
}

async function handlePlanet(sock, msg, args, userData, db) {
    // Implementar planeta
}

async function handleAttack(sock, msg, args, userData, db) {
    // Implementar ataques
}

async function handleSettings(sock, msg, args, userData, db) {
    // Implementar configuración
}

async function handleAbout(sock, msg) {
    const aboutText = `_Bienvenido a la opción de ayuda_ *GALAXIA*

*Objetivo del juego*
El objetivo del juego es crear un mundo abierto donde los jugadores puedan extraer objetos y luego venderlos para ganar dinero.

> *Pasos del juego*
*Exploración:* Navega por el mundo abierto
*Minería:* Extrae varios objetos valiosos
*Venta de Items:* Vende tus items conseguidos
*Compra de Items:* Usa el dinero para comprar equipamiento
*Combate:* Enfréntate y ataca a otros jugadores

Diviértete minando, negociando y luchando!`
    
    await sock.sendMessage(msg.key.remoteJid, {
        text: aboutText
    }, { quoted: msg })
}

export default galaxiaCommand