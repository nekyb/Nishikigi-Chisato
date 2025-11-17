import { 
    saveDatabase, 
    formatCurrency,
    getObjectData,
    getRobotData,
    getIslandData
} from '../lib/robotic.js'

export async function handleShop(sock, msg, args, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    const section = args[1] ? args[1].toLowerCase() : 'items'
    const objectsData = await getObjectData()
    const robotsData = await getRobotData()
    if (section === 'robots' && userData.totalXP < 30) {
        return await sock.sendMessage(chatId, {
            text: `🔒 *SECCIÓN BLOQUEADA*\n\n❌ Necesitas 30 XP para desbloquear la sección de robots.\n\n📊 Tu XP: ${userData.totalXP} XP`
        }, { quoted: msg })
    }
    
    if (section === 'robots') {
        let shopText = `*╔═══ 🤖 TIENDA DE ROBOTS 🤖 ═══╗*\n\n`
        for (const robot of robotsData.robots) {
            const owned = userData.robots.find(r => r.id === robot.id)
            shopText += `*${robot.name}* (ID: ${robot.id})\n`
            shopText += `  💰 Precio: ${formatCurrency(robot.price)}\n`
            shopText += `  ⚡ XP/min: ${robot.xpPerMinute}\n`
            shopText += `  ${owned ? '✅ YA TIENES' : '🛒 Disponible'}\n\n`
        }
        
        shopText += `*╚══════════════════════╝*\n\n`
        shopText += `💡 Usa *#robotic buy <id>* para comprar`
        return await sock.sendMessage(chatId, {
            text: shopText
        }, { quoted: msg })
    }
    
    let shopText = `*╔═══ 🛒 TIENDA - ITEMS 🛒 ═══╗*\n\n`
    const items = objectsData.items.slice(0, 10) 
    for (const item of items) {
        shopText += `*${item.name}* (ID: ${item.id})\n`
        shopText += `  💰 Precio: ${formatCurrency(item.price)}\n`
        shopText += `  📝 ${item.description}\n\n`
    }
    
    shopText += `*╚══════════════════════╝*\n\n`
    shopText += `🤖 Usa *#robotic shop robots* para ver robots\n`
    shopText += `💡 Usa *#robotic buy <id>* para comprar`
    await sock.sendMessage(chatId, {
        text: shopText
    }, { quoted: msg })
}

export async function handleBuy(sock, msg, args, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    if (!args[1]) {
        return await sock.sendMessage(chatId, {
            text: `❌ Uso correcto: *#robotic buy <id>*\n\nEjemplo: #robotic buy bob`
        }, { quoted: msg })
    }
    
    const itemId = args[1].toLowerCase()
    const objectsData = await getObjectData()
    const robotsData = await getRobotData()
    const robot = robotsData.robots.find(r => r.id === itemId)
    if (robot) {
        if (userData.robots.find(r => r.id === robot.id)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Ya tienes el robot *${robot.name}*`
            }, { quoted: msg })
        }
        
        if (userData.totalXP < 30) {
            return await sock.sendMessage(chatId, {
                text: `🔒 Necesitas 30 XP para comprar robots.\n\n📊 Tu XP: ${userData.totalXP} XP`
            }, { quoted: msg })
        }
        
        if (userData.money < robot.price) {
            return await sock.sendMessage(chatId, {
                text: `❌ No tienes suficiente dinero.\n\n💰 Necesitas: ${formatCurrency(robot.price)}\n💵 Tienes: ${formatCurrency(userData.money)}`
            }, { quoted: msg })
        }

        userData.money -= robot.price
        userData.robots.push({
            id: robot.id,
            name: robot.name,
            xpPerMinute: robot.xpPerMinute,
            price: robot.price,
            working: false,
            startTime: null,
            accumulatedXP: 0
        })
        
        await saveDatabase(db)
        return await sock.sendMessage(chatId, {
            text: `*╔═══ ✅ COMPRA EXITOSA ✅ ═══╗*\n\n🤖 Has comprado: *${robot.name}*\n\n*📊 ESTADÍSTICAS:*\n⚡ XP/min: ${robot.xpPerMinute}\n💰 Costo: ${formatCurrency(robot.price)}\n\n💵 Dinero restante: ${formatCurrency(userData.money)}\n\n*╚══════════════════════╝*\n\n💡 Usa *#robotic farm* para ponerlo a trabajar`
        }, { quoted: msg })
    }
    
    const item = objectsData.items.find(i => i.id === itemId)
    if (item) {
        if (userData.money < item.price) {
            return await sock.sendMessage(chatId, {
                text: `❌ No tienes suficiente dinero.\n\n💰 Necesitas: ${formatCurrency(item.price)}\n💵 Tienes: ${formatCurrency(userData.money)}`
            }, { quoted: msg })
        }

        userData.money -= item.price
        const existingItem = userData.inventory.find(i => i.id === item.id)
        if (existingItem) {
            existingItem.quantity += 1
        } else {
            userData.inventory.push({
                id: item.id,
                name: item.name,
                price: item.price,
                description: item.description,
                type: item.type,
                effect: item.effect,
                quantity: 1
            })
        }
        
        await saveDatabase(db)
        return await sock.sendMessage(chatId, {
            text: `*╔═══ ✅ COMPRA EXITOSA ✅ ═══╗*\n\n🎁 Has comprado: *${item.name}*\n\n*📊 DETALLES:*\n💰 Costo: ${formatCurrency(item.price)}\n📝 ${item.description}\n\n💵 Dinero restante: ${formatCurrency(userData.money)}\n\n*╚══════════════════════╝*`
        }, { quoted: msg })
    }
    
    await sock.sendMessage(chatId, {
        text: `❌ Item no encontrado con ID: *${itemId}*\n\n> Usa *#robotic shop* para ver items disponibles`
    }, { quoted: msg })
}

export async function handleSell(sock, msg, args, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    if (!args[1]) {
        return await sock.sendMessage(chatId, {
            text: `❌ Uso correcto: *#robotic sell <id>*\n\nEjemplo: #robotic sell potion1`
        }, { quoted: msg })
    }
    
    const itemId = args[1].toLowerCase()
    const item = userData.inventory.find(i => i.id === itemId)
    if (!item) {
        return await sock.sendMessage(chatId, {
            text: `❌ No tienes ese item en tu inventario.\n\n> Usa *#robotic inv* para ver tu inventario`
        }, { quoted: msg })
    }
    
    const sellPrice = Math.floor(item.price * 0.5)
    userData.money += sellPrice
    item.quantity -= 1
    if (item.quantity <= 0) {
        userData.inventory = userData.inventory.filter(i => i.id !== itemId)
    }
    
    await saveDatabase(db)
    await sock.sendMessage(chatId, {
        text: `*╔═══ 💰 VENTA EXITOSA 💰 ═══╗*\n\n✅ Has vendido: *${item.name}*\n\n💵 Ganancia: ${formatCurrency(sellPrice)}\n💰 Dinero total: ${formatCurrency(userData.money)}\n\n*╚══════════════════════╝*`
    }, { quoted: msg })
}

export async function handleChest(sock, msg, args, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    if (!args[1]) {
        return await sock.sendMessage(chatId, {
            text: `❌ Uso correcto:\n\n• *#robotic cofre reclamar* - Reclamar XP\n• *#robotic cofre mejora* - Mejorar cofre`
        }, { quoted: msg })
    }
    
    const action = args[1].toLowerCase()
    if (action === 'reclamar' || action === 'claim') {
        if (userData.chest.currentXP === 0) {
            return await sock.sendMessage(chatId, {
                text: `📦 *COFRE VACÍO*\n\n❌ No tienes XP para reclamar.\n\n> Usa *#robotic farm* para generar XP`
            }, { quoted: msg })
        }
        
        const xpToAdd = userData.chest.currentXP
        userData.totalXP += xpToAdd
        userData.chest.currentXP = 0
        for (const robot of userData.robots) {
            if (!robot.working) {
                robot.working = true
                robot.startTime = Date.now()
                robot.accumulatedXP = 0
            }
        }
        
        await saveDatabase(db)
        return await sock.sendMessage(chatId, {
            text: `*╔═══ 🎉 XP RECLAMADA 🎉 ═══╗*\n\n✅ Has reclamado: *${xpToAdd.toLocaleString()} XP*\n\n*📊 ESTADÍSTICAS:*\n⚡ XP Total: ${userData.totalXP.toLocaleString()} XP\n📦 Cofre: ${userData.chest.currentXP}/${userData.chest.maxXP} XP\n\n*╚══════════════════════╝*\n\n🚀 ¡Tus robots continúan trabajando!`
        }, { quoted: msg })
    }
    
    if (action === 'mejora' || action === 'upgrade') {
        const chestUpgrades = {
            'Madera': { next: 'Cobre', maxXP: 250, cost: 50 },
            'Cobre': { next: 'Oro', maxXP: 500, cost: 150 },
            'Oro': { next: 'Diamante', maxXP: 1000, cost: 300 },
            'Diamante': { next: null, maxXP: 0, cost: 0 }
        }
        
        const currentChest = userData.chest.type
        const upgrade = chestUpgrades[currentChest]
        if (!upgrade.next) {
            return await sock.sendMessage(chatId, {
                text: `💎 Ya tienes el mejor cofre disponible: *${currentChest}*`
            }, { quoted: msg })
        }
        
        if (userData.money < upgrade.cost) {
            return await sock.sendMessage(chatId, {
                text: `❌ No tienes suficiente dinero.\n\n💰 Necesitas: ${formatCurrency(upgrade.cost)}\n💵 Tienes: ${formatCurrency(userData.money)}`
            }, { quoted: msg })
        }
        
        userData.money -= upgrade.cost
        userData.chest.type = upgrade.next
        userData.chest.maxXP = upgrade.maxXP
        await saveDatabase(db)
        return await sock.sendMessage(chatId, {
            text: `*╔═══ ⬆️ MEJORA EXITOSA ⬆️ ═══╗*\n\n✅ Cofre mejorado a: *${upgrade.next}*\n\n*📊 NUEVO COFRE:*\n📦 Capacidad: ${upgrade.maxXP} XP\n💰 Costo: ${formatCurrency(upgrade.cost)}\n\n💵 Dinero restante: ${formatCurrency(userData.money)}\n\n*╚══════════════════════╝*`
        }, { quoted: msg })
    }
    
    await sock.sendMessage(chatId, {
        text: `❌ Acción no válida: *${action}*\n\nUsa:\n• *reclamar* - Reclamar XP\n• *mejora* - Mejorar cofre`
    }, { quoted: msg })
}

export async function handleMine(sock, msg, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    const now = Date.now()
    const cooldown = 3 * 60 * 1000 
    if (userData.lastMine && (now - userData.lastMine) < cooldown) {
        const timeLeft = Math.ceil((cooldown - (now - userData.lastMine)) / 1000)
        const minutes = Math.floor(timeLeft / 60)
        const seconds = timeLeft % 60
        return await sock.sendMessage(chatId, {
            text: `⏳ *COOLDOWN ACTIVO*\n\n❌ Debes esperar ${minutes}m ${seconds}s para minar nuevamente.`
        }, { quoted: msg })
    }
    
    const minAmount = 5
    const maxAmount = 20
    const minedCoins = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount
    userData.money += minedCoins
    userData.lastMine = now
    await saveDatabase(db)
    await sock.sendMessage(chatId, {
        text: `*╔═══ ⛏️ MINERÍA EXITOSA ⛏️ ═══╗*\n\n✅ Has minado: *${formatCurrency(minedCoins)}*\n\n💰 Dinero total: ${formatCurrency(userData.money)}\n\n*╚══════════════════════╝*\n\n⏳ Cooldown: 3 minutos`
    }, { quoted: msg })
}

export async function handleDaily(sock, msg, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    if (userData.lastDaily && (now - userData.lastDaily) < oneDayMs) {
        const timeLeft = Math.ceil((oneDayMs - (now - userData.lastDaily)) / 1000 / 60 / 60)
        return await sock.sendMessage(chatId, {
            text: `⏳ *YA RECLAMASTE HOY*\n\n❌ Debes esperar ${timeLeft} horas para reclamar nuevamente.`
        }, { quoted: msg })
    }
    
    const baseReward = 10000
    const daysInRow = userData.dailyStreak || 0
    const reward = baseReward + (daysInRow * 10000)
    userData.totalXP += reward
    userData.dailyStreak = daysInRow + 1
    userData.lastDaily = now
    await saveDatabase(db)
    await sock.sendMessage(chatId, {
        text: `*╔═══ 🎁 RECOMPENSA DIARIA 🎁 ═══╗*\n\n✅ Has reclamado: *${reward.toLocaleString()} XP*\n\n*📊 ESTADÍSTICAS:*\n🔥 Racha: ${userData.dailyStreak} días\n⚡ XP Total: ${userData.totalXP.toLocaleString()} XP\n\n*╚══════════════════════╝*\n\n💡 ¡Vuelve mañana para más recompensas!`
    }, { quoted: msg })
}

export async function handleVote(sock, msg, args, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    if (!args[1]) {
        return await sock.sendMessage(chatId, {
            text: `❌ Uso correcto: *#robotic votar <robot-id>*\n\nEjemplo: #robotic votar bob`
        }, { quoted: msg })
    }
    
    const robotId = args[1].toLowerCase()
    const robotsData = await getRobotData()
    const robot = robotsData.robots.find(r => r.id === robotId)
    if (!robot) {
        return await sock.sendMessage(chatId, {
            text: `❌ Robot no encontrado: *${robotId}*`
        }, { quoted: msg })
    }

    if (!db.votes) {
        db.votes = {}
    }
    if (!db.votes[robotId]) {
        db.votes[robotId] = { count: 0, lastUpdate: Date.now() }
    }
    
    if (!userData.votes) {
        userData.votes = {}
    }
    
    const now = Date.now()
    const voteWindow = 70 * 60 * 1000 
    if (userData.votes[robotId] && (now - userData.votes[robotId]) < voteWindow) {
        const timeLeft = Math.ceil((voteWindow - (now - userData.votes[robotId])) / 1000 / 60)
        return await sock.sendMessage(chatId, {
            text: `⏳ Ya votaste por *${robot.name}*\n\n❌ Espera ${timeLeft} minutos para votar nuevamente.`
        }, { quoted: msg })
    }
    
    db.votes[robotId].count += 1
    userData.votes[robotId] = now
    if ((now - db.votes[robotId].lastUpdate) >= voteWindow) {
        robot.price += 0.5
        db.votes[robotId].lastUpdate = now
    }
    
    await saveDatabase(db)
    await sock.sendMessage(chatId, {
        text: `*╔═══ ✅ VOTO REGISTRADO ✅ ═══╗*\n\n🤖 Has votado por: *${robot.name}*\n\n*📊 ESTADÍSTICAS:*\n🗳️ Votos totales: ${db.votes[robotId].count}\n💰 Precio actual: ${formatCurrency(robot.price)}\n\n*╚══════════════════════╝*`
    }, { quoted: msg })
}

export async function handleXPM(sock, msg, args, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    if (!args[1] || isNaN(args[1])) {
        return await sock.sendMessage(chatId, {
            text: `❌ Uso correcto: *#robotic xpm <cantidad>*\n\nEjemplo: #robotic xpm 100`
        }, { quoted: msg })
    }
    
    const xpAmount = parseInt(args[1])
    if (xpAmount <= 0) {
        return await sock.sendMessage(chatId, {
            text: `❌ La cantidad debe ser mayor a 0`
        }, { quoted: msg })
    }
    
    if (userData.totalXP < xpAmount) {
        return await sock.sendMessage(chatId, {
            text: `❌ No tienes suficiente XP.\n\n⚡ Tienes: ${userData.totalXP.toLocaleString()} XP\n💡 Necesitas: ${xpAmount.toLocaleString()} XP`
        }, { quoted: msg })
    }
    
    const moneyGained = Math.floor(xpAmount / 10)
    if (moneyGained === 0) {
        return await sock.sendMessage(chatId, {
            text: `❌ Necesitas al menos 10 XP para intercambiar.`
        }, { quoted: msg })
    }
    
    userData.totalXP -= xpAmount
    userData.money += moneyGained
    await saveDatabase(db)
    await sock.sendMessage(chatId, {
        text: `*╔═══ 💱 INTERCAMBIO EXITOSO 💱 ═══╗*\n\n✅ Intercambiaste: *${xpAmount.toLocaleString()} XP*\n💰 Recibiste: *${formatCurrency(moneyGained)}*\n\n*📊 BALANCE:*\n⚡ XP restante: ${userData.totalXP.toLocaleString()} XP\n💵 Dinero total: ${formatCurrency(userData.money)}\n\n*╚══════════════════════╝*\n\n💡 Tasa: 10 XP = $1`
    }, { quoted: msg })
}

export async function handleTravel(sock, msg, args, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    const islandsData = await getIslandData()
    if (!args[1]) {
        let islandsText = `*╔═══ 🏝️ ISLAS DISPONIBLES 🏝️ ═══╗*\n\n` 
        for (const island of islandsData.islands) {
            const isCurrent = userData.currentIsland === island.name
            islandsText += `${isCurrent ? '📍' : '🏝️'} *${island.name}*\n`
            islandsText += `  📝 ${island.description}\n`
            islandsText += `  💰 Costo: ${formatCurrency(island.travelCost)}\n`
            islandsText += `  ${isCurrent ? '✅ Estás aquí' : ''}\n\n`
        }
        
        islandsText += `*╚══════════════════════╝*\n\n`
        islandsText += `💡 Usa *#robotic viajar <isla>* para viajar`
        return await sock.sendMessage(chatId, {
            text: islandsText
        }, { quoted: msg })
    }
    
    const islandName = args.slice(1).join(' ')
    const island = islandsData.islands.find(i => i.name.toLowerCase() === islandName.toLowerCase())
    if (!island) {
        return await sock.sendMessage(chatId, {
            text: `❌ Isla no encontrada: *${islandName}*\n\n> Usa *#robotic viajar* para ver islas disponibles`
        }, { quoted: msg })
    }
    
    if (userData.currentIsland === island.name) {
        return await sock.sendMessage(chatId, {
            text: `📍 Ya estás en *${island.name}*`
        }, { quoted: msg })
    }
    
    if (userData.money < island.travelCost) {
        return await sock.sendMessage(chatId, {
            text: `❌ No tienes suficiente dinero para viajar.\n\n💰 Necesitas: ${formatCurrency(island.travelCost)}\n💵 Tienes: ${formatCurrency(userData.money)}`
        }, { quoted: msg })
    }
    
    userData.money -= island.travelCost
    userData.currentIsland = island.name
    await saveDatabase(db)
    await sock.sendMessage(chatId, {
        text: `*╔═══ ✈️ VIAJE EXITOSO ✈️ ═══╗*\n\n🏝️ Has viajado a: *${island.name}*\n\n📝 ${island.description}\n💰 Costo: ${formatCurrency(island.travelCost)}\n💵 Dinero restante: ${formatCurrency(userData.money)}\n\n*╚══════════════════════╝*`
    }, { quoted: msg })
}

export async function handleTop(sock, msg, db) {
    const chatId = msg.key.remoteJid
    const users = Object.entries(db.users)
        .filter(([_, data]) => data.registered)
        .map(([key, data]) => ({
            name: data.name,
            totalXP: data.totalXP,
            money: data.money,
            rebirths: data.rebirths
        }))
        .sort((a, b) => b.totalXP - a.totalXP)
        .slice(0, 10)
    if (users.length === 0) {
        return await sock.sendMessage(chatId, {
            text: `📊 No hay suficientes jugadores registrados aún.`
        }, { quoted: msg })
    }
    
    let topText = `*╔═══ 🏆 TOP 10 JUGADORES 🏆 ═══╗*\n\n`
    
    users.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
        topText += `${medal} *${user.name}*\n`
        topText += `   ⚡ ${user.totalXP.toLocaleString()} XP\n`
        topText += `   💰 ${formatCurrency(user.money)}\n`
        topText += `   🔄 ${user.rebirths} Renacimientos\n\n`
    })
    
    topText += `*╚══════════════════════╝*`
    await sock.sendMessage(chatId, {
        text: topText
    }, { quoted: msg })
}

export async function handleRebirth(sock, msg, userKey, db) {
    const chatId = msg.key.remoteJid
    const userData = db.users[userKey]
    const requiredXP = 100000 + (userData.rebirths * 50000)
    if (userData.totalXP < requiredXP) {
        return await sock.sendMessage(chatId, {
            text: `❌ No tienes suficiente XP para renacer.\n\n⚡ Necesitas: ${requiredXP.toLocaleString()} XP\n⚡ Tienes: ${userData.totalXP.toLocaleString()} XP`
        }, { quoted: msg })
    }
    
    const confirmText = `*╔═══ ⚠️ CONFIRMAR RENACIMIENTO ⚠️ ═══╗*\n\n¿Estás seguro de querer renacer?\n\n*PERDERÁS:*\n❌ Todo tu XP\n❌ Todo tu dinero\n❌ Todos tus robots (excepto Bob)\n❌ Todo tu inventario\n\n*CONSERVARÁS:*\n✅ +1 Renacimiento\n✅ Multiplicador de XP mejorado\n\n*╚══════════════════════╝*\n\n⚠️ Esta acción no se puede deshacer.\n\nResponde *SI* para confirmar.`
    await sock.sendMessage(chatId, {
        text: confirmText
    }, { quoted: msg })

}