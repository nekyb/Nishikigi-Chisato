import axios from 'axios'

const CRYPTO_CACHE = new Map()
const CACHE_DURATION = 60000

async function getCryptoPrice(cryptoIds) {
    const cacheKey = cryptoIds.join(',')
    const cached = CRYPTO_CACHE.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data}
    try {const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {params: {
                ids: cryptoIds.join(','),
                vs_currencies: 'usd',
                include_market_cap: 'true',
                include_24hr_vol: 'true',
                include_24hr_change: 'true'}})
        CRYPTO_CACHE.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()})
        return response.data} catch (error) {console.error('Error fetching crypto prices:', error)
        return null}}

async function getCryptoTrending() {
    try {const response = await axios.get('https://api.coingecko.com/api/v3/search/trending')
        return response.data.coins || []} catch (error) {console.error('Error fetching trending:', error)
        return []}}

function formatPrice(price) {
    if (price >= 1) {return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
    return `$${price.toFixed(8)}`}

function formatNumber(num) {if (num >= 1e9) {return `$${(num / 1e9).toFixed(2)}B`} else if (num >= 1e6) {return `$${(num / 1e6).toFixed(2)}M`} else if (num >= 1e3) {return `$${(num / 1e3).toFixed(2)}K`}
return `$${num.toFixed(2)}`}

function getChangeEmoji(change) {
    if (change > 5) return '🚀'
    if (change > 0) return '📈'
    if (change < -5) return '📉'
    if (change < 0) return '🔻'
    return '➡️'}

const cryptoMap = {
    'btc': 'bitcoin',
    'bitcoin': 'bitcoin',
    'eth': 'ethereum',
    'ethereum': 'ethereum',
    'bnb': 'binancecoin',
    'binance': 'binancecoin',
    'sol': 'solana',
    'solana': 'solana',
    'ada': 'cardano',
    'cardano': 'cardano',
    'xrp': 'ripple',
    'ripple': 'ripple',
    'doge': 'dogecoin',
    'dogecoin': 'dogecoin',
    'dot': 'polkadot',
    'polkadot': 'polkadot',
    'matic': 'matic-network',
    'polygon': 'matic-network',
    'link': 'chainlink',
    'chainlink': 'chainlink'
}

export default {
    name: 'crypto',
    aliases: ['cripto', 'coin', 'price'],
    category: 'tools',
    description: 'Muestra el precio actual de criptomonedas en tiempo real',
    usage: '.crypto [moneda1] [moneda2] ... o .crypto trending',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid

        await sock.sendMessage(chatId, {
            react: {
                text: '💰',
                key: msg.key
            }
        })

        try {
            if (args.length === 0 || args[0].toLowerCase() === 'trending') {
                const trending = await getCryptoTrending()
                
                if (trending.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: '❌ No se pudieron obtener las monedas en tendencia.'
                    }, { quoted: msg })
                }

                let response = '🔥 *TOP CRYPTOS EN TENDENCIA*\n\n'
                trending.slice(0, 7).forEach((coin, i) => {
                    const item = coin.item
                    response += `${i + 1}. *${item.name}* (${item.symbol})\n`
                    response += `   Rank: #${item.market_cap_rank || 'N/A'}\n`
                    response += `   Score: ${item.score + 1}\n\n`
                })

                response += `\n_Actualizado: ${new Date().toLocaleTimeString('es-ES')}_`
                response += `\n> _*Powered by CoinGecko API*_`
                return await sock.sendMessage(chatId, {
                    text: response
                }, { quoted: msg })
            }

            const requestedCoins = args.map(arg => arg.toLowerCase())
            const cryptoIds = requestedCoins.map(coin => cryptoMap[coin] || coin)
            const data = await getCryptoPrice(cryptoIds)
            if (!data || Object.keys(data).length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '❌ No se pudo obtener información de las criptomonedas solicitadas.\n\n*Uso:* .crypto btc eth sol\n*Trending:* .crypto trending'
                }, { quoted: msg })
            }

            let response = '💎 *PRECIOS DE CRIPTOMONEDAS*\n\n'
            Object.keys(data).forEach((cryptoId) => {
                const crypto = data[cryptoId]
                const change24h = crypto.usd_24h_change || 0
                const emoji = getChangeEmoji(change24h)
                const name = cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1)
                response += `*${name}*\n`
                response += `💵 Precio: ${formatPrice(crypto.usd)}\n`
                response += `${emoji} 24h: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%\n`
                response += `📊 Cap: ${formatNumber(crypto.usd_market_cap)}\n`
                response += `📈 Vol: ${formatNumber(crypto.usd_24h_vol)}\n\n`
            })

            response += `_Actualizado: ${new Date().toLocaleTimeString('es-ES')}_\n`
            response += `> _*Powered by DeltaByte*_`
            await sock.sendMessage(chatId, {
                text: response
            }, { quoted: msg })

        } catch (error) {
            console.error('Error en crypto command:', error)
            await sock.sendMessage(chatId, {
                text: '❌ Error al obtener precios. Intenta de nuevo en unos segundos.\n\n*Ejemplo de uso:*\n.crypto btc eth\n.crypto trending'
            }, { quoted: msg })
        }
    }
}
