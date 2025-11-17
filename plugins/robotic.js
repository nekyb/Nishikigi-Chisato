import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { 
    loadDatabase, 
    saveDatabase, 
    initializeUser,
    getUserKey,
    formatCurrency,
    calculateTimeDifference,
    getIslandData,
    getObjectData,
    getRobotData
} from '../lib/robotic.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const roboticCommand = {
    name: 'robotic',
    aliases: ['robot', 're'],
    category: 'game',
    description: 'Robotic Empire - Construye tu imperio con robots',
    usage: '#robotic [comando]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        try {
            const db = await loadDatabase()
            const userKey = getUserKey(sender, db)
            if (args.length === 0) {
                return await showMainMenu(sock, msg)
            }
            
            const command = args[0].toLowerCase()
            if (command === 'register') {
                return await handleRegister(sock, msg, userKey, db)
            }
            
            if (!db.users[userKey] || !db.users[userKey].registered) {
                return await sock.sendMessage(chatId, {
                    text: `🤖 *ROBOTIC EMPIRE*\n\n❌ No estás registrado en el juego.\n\n> Usa *#robotic register* para comenzar tu aventura.`
                }, { quoted: msg })
            }
            
            await updateRobotFarming(db.users[userKey], db)
            switch (command) {
                case 'farm':
                    await handleFarm(sock, msg, userKey, db)
                    break
                    
                case 'buy':
                    await handleBuy(sock, msg, args, userKey, db)
                    break
                    
                case 'shop':
                case 'tienda':
                    await handleShop(sock, msg, args, userKey, db)
                    break
                    
                case 'sell':
                    await handleSell(sock, msg, args, userKey, db)
                    break
                    
                case 'renacer':
                case 'rebirth':
                    await handleRebirth(sock, msg, userKey, db)
                    break
                    
                case 'top':
                case 'ranking':
                    await handleTop(sock, msg, db)
                    break
                    
                case 'viajar':
                case 'travel':
                    await handleTravel(sock, msg, args, userKey, db)
                    break
                    
                case 'reclamar':
                case 'daily':
                    await handleDaily(sock, msg, userKey, db)
                    break
                    
                case 'minar':
                case 'mine':
                    await handleMine(sock, msg, userKey, db)
                    break
                    
                case 'votar':
                case 'vote':
                    await handleVote(sock, msg, args, userKey, db)
                    break
                    
                case 'xpm':
                    await handleXPM(sock, msg, args, userKey, db)
                    break
                    
                case 'cofre':
                case 'chest':
                    await handleChest(sock, msg, args, userKey, db)
                    break
                    
                case 'perfil':
                case 'profile':
                case 'me':
                    await handleProfile(sock, msg, userKey, db)
                    break
                    
                case 'inventario':
                case 'inv':
                    await handleInventory(sock, msg, userKey, db)
                    break
                    
                case 'help':
                case 'ayuda':
                    await showMainMenu(sock, msg)
                    break
                    
                default:
                    await sock.sendMessage(chatId, {
                        text: `❌ Comando *${command}* no encontrado.\n\nUsa *#robotic help* para ver todos los comandos.`
                    }, { quoted: msg })
            }
            
        } catch (error) {
            console.error('Error en comando Robotic:', error)
            await sock.sendMessage(chatId, {
                text: '❌ Ocurrió un error al procesar el comando. Intenta nuevamente.'
            }, { quoted: msg })
        }
    }
}

async function showMainMenu(sock, msg) {
    const chatId = msg.key.remoteJid
    const menuText = `*╔═══ ROBOTIC EMPIRE ═══╗*

👋 ¡Bienvenido *${msg.pushName}*!

Construye tu imperio robótico, farmea XP, mejora tus robots y conquista las islas.

> *📋 COMANDOS DISPONIBLES:*

_*INICIO*_
• #robotic register » Registrarse
• #robotic perfil » Ver tu perfil
• #robotic inventario » Ver tu inventario

_*ECONOMÍA*_
• #robotic farm » Iniciar farming
• #robotic minar » Minar monedas (cada 3min)
• #robotic reclamar » Recompensa diaria
• #robotic xpm <cantidad> » XP → Dinero

_*TIENDA*_
• #robotic shop » Ver tienda
• #robotic buy <id> » Comprar objeto
• #robotic sell <id> » Vender objeto

_*ROBOTS & COFRES*_
• #robotic votar <id> » Votar por robot
• #robotic cofre mejora » Mejorar cofre
• #robotic cofre reclamar » Reclamar XP

_*EXPLORACIÓN*_
• #robotic viajar <isla> » Viajar a isla
• #robotic top » Top 10 jugadores
• #robotic renacer » Reiniciar progreso

*╚══════════════════════╝*

💎 ¡Empieza tu aventura ahora!`
    
    await sock.sendMessage(chatId, {
        text: menuText
    }, { quoted: msg })
}

async function handleRegister(sock, msg, userKey, db) {
    const chatId = msg.key.remoteJid
    if (db.users[userKey] && db.users[userKey].registered) {
        return await sock.sendMessage(chatId, {
            text: `《✿》 Ya estás registrado en Robotic Empire, *${msg.pushName}*!`
        }, { quoted: msg })
    }

    const robotsData = await getRobotData()
    const bobRobot = robotsData.robots.find(r => r.id === 'bob')
    db.users[userKey] = initializeUser(msg.pushName, userKey)
    db.users[userKey].robots.push({
        id: bobRobot.id,
        name: bobRobot.name,
        xpPerMinute: bobRobot.xpPerMinute,
        price: bobRobot.price,
        working: false,
        startTime: null,
        accumulatedXP: 0
    })
    
    await saveDatabase(db)
    const registerText = `*╔═══ REGISTRO EXITOSO ═══╗*

✅ ¡Bienvenido a Robotic Empire, *${msg.pushName}*!

> *📊 TU INFORMACIÓN:*
✦ Dinero: $0
✦ XP Total: 0 XP
✦ Isla: Isla Inicial
✦ Cofre: Madera (110 XP)

> *🤖 ROBOT INICIAL:*
🔹 ${bobRobot.name}
  • XP/min: ${bobRobot.xpPerMinute}
  • Valor: $${bobRobot.price}

> *🎯 PRIMEROS PASOS:*
> » Usa *#robotic farm* para empezar
> » Usa *#robotic cofre reclamar* cuando llenes tu cofre
> » Explora *#robotic shop* para mejorar
> _*Powered By DeltaByte*_

*╚════════════════════╝*

💡 Tip: Usa *#robotic help* para ver todos los comandos`
    
    await sock.sendMessage(chatId, {
        text: registerText
    }, { quoted: msg })
}

async function updateRobotFarming(userData, db) {
    if (!userData.robots || userData.robots.length === 0) return
    const now = Date.now()
    let totalXP = 0
    for (const robot of userData.robots) {
        if (robot.working && robot.startTime) {
            const minutesPassed = Math.floor((now - robot.startTime) / 60000)
            const xpGenerated = minutesPassed * robot.xpPerMinute
            if (xpGenerated > 0) {
                robot.accumulatedXP += xpGenerated
                robot.startTime = now
                totalXP += xpGenerated
            }
            
            if (userData.chest.currentXP + robot.accumulatedXP >= userData.chest.maxXP) {
                const spaceLeft = userData.chest.maxXP - userData.chest.currentXP
                userData.chest.currentXP = userData.chest.maxXP
                robot.accumulatedXP -= spaceLeft
                robot.working = false
                robot.startTime = null
            }
        }
    }
    
    await saveDatabase(db)
}

async function handleFarm(sock, msg, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    if (userData.chest.currentXP >= userData.chest.maxXP) {
        return await sock.sendMessage(chatId, {
            text: `《✿》 *COFRE LLENO*\n\n❌ Tu cofre está lleno (${userData.chest.currentXP}/${userData.chest.maxXP} XP)\n\n> Usa *#robotic cofre reclamar* para reclamar tu XP`
        }, { quoted: msg })
    }
    
    let workingRobots = 0
    let stoppedRobots = []
    for (const robot of userData.robots) {
        if (!robot.working) {
            robot.working = true
            robot.startTime = Date.now()
            robot.accumulatedXP = 0
            workingRobots++
        }
    }
    
    await saveDatabase(db)
    if (workingRobots === 0) {
        return await sock.sendMessage(chatId, {
            text: `《✿》 *FARMING*\n\n✅ Todos tus robots ya están trabajando.\n\n📦 Cofre: ${userData.chest.currentXP}/${userData.chest.maxXP} XP`
        }, { quoted: msg })
    }
    
    let robotsList = userData.robots.map(r => `  🤖 ${r.name} - ${r.xpPerMinute} XP/min`).join('\n')
    const farmText = `*╔═══ FARMING INICIADO ═══╗*

✅ ¡${workingRobots} robot(s) comenzaron a trabajar!

> *🤖 ROBOTS ACTIVOS:*
${robotsList}

_*ESTADO:*_
✦ Cofre: ${userData.chest.currentXP}/${userData.chest.maxXP} XP
✦ Tiempo estimado: ${Math.ceil((userData.chest.maxXP - userData.chest.currentXP) / userData.robots.reduce((sum, r) => sum + r.xpPerMinute, 0))} minutos

*╚══════════════════════╝*

💡 Los robots se detendrán automáticamente cuando el cofre esté lleno`
    
    await sock.sendMessage(chatId, {
        text: farmText
    }, { quoted: msg })
}

async function handleProfile(sock, msg, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    await updateRobotFarming(userData, db)
    const workingRobots = userData.robots.filter(r => r.working).length
    const totalXPPerMin = userData.robots.filter(r => r.working).reduce((sum, r) => sum + r.xpPerMinute, 0)
    const profileText = `*╔═══ PERFIL ═══╗*

> *👨 ${userData.name}*

_*ECONOMÍA:*_
✦ Dinero » ${formatCurrency(userData.money)}
✦ XP Total » ${userData.totalXP.toLocaleString()} XP
✦ Renacimientos » ${userData.rebirths}

> *🏝️ UBICACIÓN:*
✦ ${userData.currentIsland}

> *📦 COFRE:*
✦ ${userData.chest.type}
✦ ${userData.chest.currentXP}/${userData.chest.maxXP} XP

> *🤖 ROBOTS:*
✦ Total » ${userData.robots.length}
✦ Activos » ${workingRobots}/${userData.robots.length}
✦ XP/min » ${totalXPPerMin}

> *📅 ÚLTIMA RECOMPENSA:*
✦ ${userData.lastDaily ? new Date(userData.lastDaily).toLocaleDateString() : 'Nunca'}

*╚══════════════════════╝*`
    
    await sock.sendMessage(chatId, {
        text: profileText
    }, { quoted: msg })
}

async function handleInventory(sock, msg, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    if (!userData.inventory || userData.inventory.length === 0) {
        return await sock.sendMessage(chatId, {
            text: `🎒 *INVENTARIO VACÍO*\n\n❌ No tienes objetos en tu inventario.\n\n> Visita *#robotic shop* para comprar`
        }, { quoted: msg })
    }
    
    let inventoryText = `*╔═══ INVENTARIO ═══╗*\n\n`
    for (const item of userData.inventory) {
        inventoryText += `*${item.name}* (ID: ${item.id})\n`
        inventoryText += `  ✦ Valor » ${formatCurrency(item.price)}\n`
        inventoryText += `  ✦ Cantidad » ${item.quantity}\n`
        if (item.description) {
            inventoryText += `  📝 ${item.description}\n`
        }
        inventoryText += `\n`
    }
    
    inventoryText += `*╚══════════════════════╝*\n\n`
    inventoryText += `💡 Usa *#robotic sell <id>* para vender`
    await sock.sendMessage(chatId, {
        text: inventoryText
    }, { quoted: msg })
}

import {
    handleShop,
    handleBuy,
    handleSell,
    handleChest,
    handleMine,
    handleDaily,
    handleVote,
    handleXPM,
    handleTravel,
    handleTop,
    handleRebirth
} from './robotic-handlers.js'

export default roboticCommand
export { 
    showMainMenu, 
    handleRegister, 
    handleProfile, 
    handleInventory, 
    updateRobotFarming, 
    handleFarm 
}