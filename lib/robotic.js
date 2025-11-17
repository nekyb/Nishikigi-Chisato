// ROBOTIC EMPIRE - Librería auxiliar
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DB_PATH = join(__dirname, '../database/robotic/database.json')
const ISLANDS_PATH = join(__dirname, '../database/robotic/islas.json')
const OBJECTS_PATH = join(__dirname, '../database/robotic/objects.json')
const ROBOTS_PATH = join(__dirname, '../database/robotic/robots.json')

async function ensureDirectory(path) {
    try {
        await fs.access(path)
    } catch {
        await fs.mkdir(path, { recursive: true })
    }
}

export async function loadDatabase() {
    try {
        await ensureDirectory(join(__dirname, '../database/robotic'))
        try {
            const data = await fs.readFile(DB_PATH, 'utf-8')
            return JSON.parse(data)
        } catch {
            const baseDB = {
                users: {},
                votes: {},
                globalStats: {
                    totalUsers: 0,
                    totalXP: 0,
                    totalMoney: 0
                }
            }
            await fs.writeFile(DB_PATH, JSON.stringify(baseDB, null, 2))
            return baseDB
        }
    } catch (error) {
        console.error('Error cargando database:', error)
        throw error
    }
}

export async function saveDatabase(db) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
    } catch (error) {
        console.error('Error guardando database:', error)
        throw error
    }
}

export function initializeUser(name, id) {
    return {
        registered: true,
        name: name,
        id: id,
        money: 0,
        totalXP: 0,
        currentIsland: 'Isla Inicial',
        rebirths: 0,
        dailyStreak: 0,
        lastDaily: null,
        lastMine: null,
        chest: {
            type: 'Madera',
            maxXP: 110,
            currentXP: 0
        },
        robots: [],
        inventory: [],
        votes: {},
        multipliers: {
            xp: 1.0,
            money: 1.0
        },
        achievements: [],
        statistics: {
            totalFarmed: 0,
            totalMined: 0,
            totalBought: 0,
            totalSold: 0
        }
    }
}

export function getUserKey(sender, db) {
    const senderNumber = String(sender).split('@')[0]
    const existingKey = Object.keys(db.users).find(k => k && k.split('@')[0] === senderNumber)
    return existingKey || sender
}

export function formatCurrency(amount) {
    return `$${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function calculateTimeDifference(timestamp) {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return { hours, minutes, seconds, total: diff }
}

export async function getIslandData() {
    try {
        await ensureDirectory(join(__dirname, '../database/robotic'))
        try {
            const data = await fs.readFile(ISLANDS_PATH, 'utf-8')
            return JSON.parse(data)
        } catch {
            const islands = {
                islands: [
                    {
                        id: 'inicial',
                        name: 'Isla Inicial',
                        description: 'El punto de partida de tu aventura robótica.',
                        travelCost: 0,
                        bonuses: { xp: 1.0, money: 1.0 }
                    },
                    {
                        id: 'tecnologia',
                        name: 'Isla Tecnológica',
                        description: 'Una isla llena de fábricas y robots avanzados.',
                        travelCost: 100,
                        bonuses: { xp: 1.2, money: 1.1 }
                    },
                    {
                        id: 'robotica',
                        name: 'Isla Robótica',
                        description: 'El paraíso de los robots más poderosos.',
                        travelCost: 250,
                        bonuses: { xp: 1.5, money: 1.3 }
                    }
                ]
            }
            await fs.writeFile(ISLANDS_PATH, JSON.stringify(islands, null, 2))
            return islands
        }
    } catch (error) {
        console.error('Error cargando islas:', error)
        return { islands: [] }
    }
}

export async function getObjectData() {
    try {
        await ensureDirectory(join(__dirname, '../database/robotic'))
        try {
            const data = await fs.readFile(OBJECTS_PATH, 'utf-8')
            return JSON.parse(data)
        } catch {
            const objects = {
                items: [
                    { id: 'potion1', name: 'Poción de XP x2', price: 50, type: 'potion', effect: { xp: 2, duration: 3600000 }, description: 'Duplica XP por 1 hora' },
                    { id: 'potion2', name: 'Poción de XP x3', price: 120, type: 'potion', effect: { xp: 3, duration: 3600000 }, description: 'Triplica XP por 1 hora' },
                    { id: 'potion3', name: 'Poción de XP x4', price: 200, type: 'potion', effect: { xp: 4, duration: 3600000 }, description: 'Cuadruplica XP por 1 hora' },
                    { id: 'potion4', name: 'Poción de Dinero x2', price: 60, type: 'potion', effect: { money: 2, duration: 3600000 }, description: 'Duplica ganancias de dinero por 1 hora' },
                    { id: 'potion5', name: 'Poción de Velocidad', price: 80, type: 'potion', effect: { speed: 1.5, duration: 1800000 }, description: 'Aumenta velocidad de robots 50% por 30 min' },
                    { id: 'upgrade1', name: 'Chip de Eficiencia', price: 150, type: 'upgrade', effect: { xpBonus: 0.1 }, description: '+10% XP permanente' },
                    { id: 'upgrade2', name: 'Módulo de Potencia', price: 200, type: 'upgrade', effect: { xpBonus: 0.15 }, description: '+15% XP permanente' },
                    { id: 'upgrade3', name: 'Core Avanzado', price: 300, type: 'upgrade', effect: { xpBonus: 0.25 }, description: '+25% XP permanente' },
                    { id: 'util1', name: 'Llave Maestra', price: 100, type: 'utility', effect: { unlockRobots: true }, description: 'Desbloquea sección de robots' },
                    { id: 'util2', name: 'Ticket de Viaje', price: 50, type: 'utility', effect: { freeTravel: 1 }, description: 'Un viaje gratis a cualquier isla' },
                    { id: 'util3', name: 'Reset de Cooldown', price: 75, type: 'utility', effect: { resetCooldown: true }, description: 'Resetea cooldown de minería' },
                    { id: 'util4', name: 'Expansión de Cofre', price: 180, type: 'utility', effect: { chestBonus: 50 }, description: '+50 capacidad al cofre' },
                    { id: 'special1', name: 'Batería Energética', price: 40, type: 'consumable', effect: { instantXP: 500 }, description: '+500 XP instantáneos' },
                    { id: 'special2', name: 'Caja de Engranajes', price: 60, type: 'consumable', effect: { instantMoney: 100 }, description: '+$100 instantáneos' },
                    { id: 'special3', name: 'Blueprint Raro', price: 250, type: 'consumable', effect: { randomRobot: true }, description: 'Robot aleatorio gratis' },
                    { id: 'cosmetic1', name: 'Pintura Cromada', price: 30, type: 'cosmetic', effect: { cosmetic: true }, description: 'Personaliza tus robots' },
                    { id: 'cosmetic2', name: 'Holograma Personalizado', price: 50, type: 'cosmetic', effect: { cosmetic: true }, description: 'Holograma único' },
                    { id: 'cosmetic3', name: 'Tema Neon', price: 80, type: 'cosmetic', effect: { cosmetic: true }, description: 'Tema visual especial' },
                    { id: 'rare1', name: 'Cristal de Energía', price: 300, type: 'rare', effect: { xpBoost: 5, duration: 7200000 }, description: 'x5 XP por 2 horas' },
                    { id: 'rare2', name: 'Núcleo Cuántico', price: 400, type: 'rare', effect: { allBonus: 2, duration: 3600000 }, description: 'x2 todo por 1 hora' },
                    { id: 'rare3', name: 'Gema del Tiempo', price: 500, type: 'rare', effect: { timeSkip: 3600000 }, description: 'Avanza 1 hora de farming instantáneamente' },
                    { id: 'legend1', name: 'Fragmento Estelar', price: 800, type: 'legendary', effect: { xpMulti: 10, duration: 1800000 }, description: 'x10 XP por 30 min' },
                    { id: 'legend2', name: 'Esencia Robótica', price: 1000, type: 'legendary', effect: { duplicateRobot: true }, description: 'Duplica un robot que poseas' },
                    { id: 'legend3', name: 'Orbe del Destino', price: 1500, type: 'legendary', effect: { rebirthBonus: 1 }, description: '+1 Renacimiento sin perder nada' },
                    { id: 'tool1', name: 'Pico Mejorado', price: 90, type: 'tool', effect: { miningBonus: 0.5 }, description: '+50% ganancias de minería' },
                    { id: 'tool2', name: 'Taladro Láser', price: 150, type: 'tool', effect: { miningBonus: 1.0 }, description: '+100% ganancias de minería' },
                    { id: 'tool3', name: 'Excavadora Automática', price: 250, type: 'tool', effect: { autoMine: true }, description: 'Minería automática cada 6 horas' },
                    { id: 'protection1', name: 'Escudo Anti-Pérdida', price: 200, type: 'protection', effect: { protectItems: 1 }, description: 'Protege 1 item al renacer' },
                    { id: 'protection2', name: 'Seguro de Robots', price: 350, type: 'protection', effect: { protectRobots: 1 }, description: 'Protege 1 robot al renacer' },
                    { id: 'protection3', name: 'Bóveda Segura', price: 500, type: 'protection', effect: { protectMoney: 0.5 }, description: 'Conserva 50% dinero al renacer' },
                    { id: 'misc1', name: 'Mapa del Tesoro', price: 120, type: 'misc', effect: { randomReward: true }, description: 'Recompensa aleatoria valiosa' },
                    { id: 'misc2', name: 'Lootbox Básica', price: 100, type: 'misc', effect: { lootbox: 'basic' }, description: '3 items aleatorios' },
                    { id: 'misc3', name: 'Lootbox Premium', price: 300, type: 'misc', effect: { lootbox: 'premium' }, description: '5 items aleatorios raros' },
                    { id: 'misc4', name: 'Lootbox Legendaria', price: 600, type: 'misc', effect: { lootbox: 'legendary' }, description: '3 items legendarios garantizados' },
                    { id: 'misc5', name: 'Contrato de Trabajo', price: 180, type: 'misc', effect: { workerBonus: 0.2 }, description: 'Robots trabajan 20% más rápido' }
                ]
            }
            await fs.writeFile(OBJECTS_PATH, JSON.stringify(objects, null, 2))
            return objects
        }
    } catch (error) {
        console.error('Error cargando objetos:', error)
        return { items: [] }
    }
}

export async function getRobotData() {
    try {
        await ensureDirectory(join(__dirname, '../database/robotic'))
        try {
            const data = await fs.readFile(ROBOTS_PATH, 'utf-8')
            return JSON.parse(data)
        } catch {
            const robots = {
                robots: [
                    {
                        id: 'bob',
                        name: 'Bob',
                        xpPerMinute: 15,
                        price: 1,
                        rarity: 'common',
                        description: 'Un robot trabajador básico, perfecto para empezar.',
                        unlockXP: 0
                    },
                    {
                        id: 'joel',
                        name: 'Joel',
                        xpPerMinute: 30,
                        price: 10,
                        rarity: 'common',
                        description: 'Un robot más eficiente que Bob.',
                        unlockXP: 30
                    },
                    {
                        id: 'johndoe',
                        name: 'John Doe',
                        xpPerMinute: 50,
                        price: 20,
                        rarity: 'uncommon',
                        description: 'Un robot misterioso con buena productividad.',
                        unlockXP: 30
                    },
                    {
                        id: 'walle',
                        name: 'WALL-E',
                        xpPerMinute: 70,
                        price: 40,
                        rarity: 'uncommon',
                        description: 'Un adorable robot recolector.',
                        unlockXP: 30
                    },
                    {
                        id: 'bender',
                        name: 'Bender Bending Rodriguez',
                        xpPerMinute: 100,
                        price: 60,
                        rarity: 'rare',
                        description: 'Un robot con actitud y gran poder.',
                        unlockXP: 30
                    },
                    {
                        id: 'optimus',
                        name: 'Optimus Prime',
                        xpPerMinute: 180,
                        price: 80,
                        rarity: 'epic',
                        description: 'El líder de los Autobots, poderoso y noble.',
                        unlockXP: 30
                    },
                    {
                        id: 'cyn',
                        name: 'Cyn',
                        xpPerMinute: 250,
                        price: 100,
                        rarity: 'epic',
                        description: 'Un robot avanzado con capacidades superiores.',
                        unlockXP: 30
                    },
                    {
                        id: 'eva',
                        name: 'Eva',
                        xpPerMinute: 300,
                        price: 110,
                        rarity: 'legendary',
                        description: 'El robot más avanzado, eficiente y poderoso.',
                        unlockXP: 30
                    }
                ]
            }
            await fs.writeFile(ROBOTS_PATH, JSON.stringify(robots, null, 2))
            return robots
        }
    } catch (error) {
        console.error('Error cargando robots:', error)
        return { robots: [] }
    }
}

export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function calculateNextLevelXP(currentLevel) {
    return Math.floor(1000 * Math.pow(1.5, currentLevel - 1))
}

export function isOnCooldown(lastTime, cooldownMs) {
    if (!lastTime) return false
    return (Date.now() - lastTime) < cooldownMs
}

export function getCooldownRemaining(lastTime, cooldownMs) {
    if (!lastTime) return 0
    const remaining = cooldownMs - (Date.now() - lastTime)
    return remaining > 0 ? remaining : 0
}

export function formatTime(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
}