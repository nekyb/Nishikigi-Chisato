const fs = require('fs')
const path = require('path')

const initUserEconomy = (userId, name) => {
    const userData = {
        user_id: userId,
        name: name,
        registered_at: new Date().toISOString(),
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        economy: {
            coins: 1000,
            bank: 0,
            last_daily: null,
            last_work: null,
            inventory: [],
            stats: {
                commands_used: 0,
                messages_sent: 0,
                items_bought: 0,
                items_sold: 0
            }
        },
        settings: {
            notifications: true,
            language: "es"
        },
        achievements: [],
        xp: {
            level: 1,
            current: 0,
            required: 100
        }
    }

    const usersPath = path.join(__dirname, '../database/users.json')
    let users = []
    
    try {
        users = JSON.parse(fs.readFileSync(usersPath))
    } catch (error) {
        users = []
    }

    const existingUser = users.find(user => user.user_id === userId)
    if (!existingUser) {
        users.push(userData)
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))
    }
    
    return userData
}

const getUser = (userId) => {
    const usersPath = path.join(__dirname, '../database/users.json')
    try {
        const users = JSON.parse(fs.readFileSync(usersPath))
        return users.find(user => user.user_id === userId) || null
    } catch (error) {
        return null
    }
}

const updateUser = (userId, updates) => {
    const usersPath = path.join(__dirname, '../database/users.json')
    try {
        let users = JSON.parse(fs.readFileSync(usersPath))
        const userIndex = users.findIndex(user => user.user_id === userId)
        
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                ...updates,
                updated_at: new Date().toISOString()
            }
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))
            return users[userIndex]
        }
        return null
    } catch (error) {
        return null
    }
}

const addCoins = (userId, amount) => {
    const user = getUser(userId)
    if (user) {
        const newBalance = (user.economy.coins || 0) + amount
        return updateUser(userId, {
            economy: {
                ...user.economy,
                coins: newBalance
            }
        })
    }
    return null
}

const removeCoins = (userId, amount) => {
    const user = getUser(userId)
    if (user && user.economy.coins >= amount) {
        const newBalance = user.economy.coins - amount
        return updateUser(userId, {
            economy: {
                ...user.economy,
                coins: newBalance
            }
        })
    }
    return null
}

module.exports = {
    initUserEconomy,
    getUser,
    updateUser,
    addCoins,
    removeCoins
}