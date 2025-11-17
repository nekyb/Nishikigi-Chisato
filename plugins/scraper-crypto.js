import axios from 'axios';

export default {
    name: 'crypto',
    aliases: ['cripto', 'coin', 'bitcoin'],
    category: 'scraper',
    description: 'Obtiene información en tiempo real de criptomonedas',
    usage: '#crypto [símbolo]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            if (args.length === 0) {
                const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false');
                const coins = response.data;
                let message = `《✿》 *Top 10 Criptomonedas* 💎\n\n`;
                coins.forEach((coin, index) => {
                    const priceChange = coin.price_change_percentage_24h || 0;
                    const arrow = priceChange >= 0 ? '📈' : '📉';
                    const sign = priceChange >= 0 ? '+' : '';
                    message += `${index + 1}. *${coin.name}* (${coin.symbol.toUpperCase()})\n`;
                    message += `   💵 $${coin.current_price.toLocaleString()}\n`;
                    message += `   ${arrow} ${sign}${priceChange.toFixed(2)}% (24h)\n`;
                    message += `   📊 Cap: $${(coin.market_cap / 1e9).toFixed(2)}B\n\n`;
                });

                message += `_Actualizado: ${new Date().toLocaleString()}_\n`;
                message += `_Datos de CoinGecko API_`;
                return await sock.sendMessage(chatId, {
                    text: message
                }, { quoted: msg });
            }

            const coinId = args[0].toLowerCase()
            const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`);
            const coin = response.data;
            const priceChange24h = coin.market_data.price_change_percentage_24h || 0;
            const priceChange7d = coin.market_data.price_change_percentage_7d || 0;
            const priceChange30d = coin.market_data.price_change_percentage_30d || 0;
            const arrow24h = priceChange24h >= 0 ? '📈' : '📉';
            const arrow7d = priceChange7d >= 0 ? '📈' : '📉';
            const arrow30d = priceChange30d >= 0 ? '📈' : '📉';
            const sign24h = priceChange24h >= 0 ? '+' : '';
            const sign7d = priceChange7d >= 0 ? '+' : '';
            const sign30d = priceChange30d >= 0 ? '+' : '';
            let message = `《✿》 *${coin.name}* (${coin.symbol.toUpperCase()}) 💎\n\n`;
            if (coin.image?.large) {
                await sock.sendMessage(chatId, {
                    image: { url: coin.image.large },
                    caption: message +
                        `💵 *Precio USD:* $${coin.market_data.current_price.usd.toLocaleString()}\n` +
                        `💶 *Precio EUR:* €${coin.market_data.current_price.eur.toLocaleString()}\n` +
                        `💴 *Precio BTC:* ₿${coin.market_data.current_price.btc.toFixed(8)}\n\n` +
                        `📊 *Cambios de Precio:*\n` +
                        `${arrow24h} 24h: ${sign24h}${priceChange24h.toFixed(2)}%\n` +
                        `${arrow7d} 7d: ${sign7d}${priceChange7d.toFixed(2)}%\n` +
                        `${arrow30d} 30d: ${sign30d}${priceChange30d.toFixed(2)}%\n\n` +
                        `💹 *Market Cap:* $${(coin.market_data.market_cap.usd / 1e9).toFixed(2)}B\n` +
                        `📈 *Volumen 24h:* $${(coin.market_data.total_volume.usd / 1e9).toFixed(2)}B\n` +
                        `🏆 *Ranking:* #${coin.market_cap_rank || 'N/A'}\n\n` +
                        `📉 *Mínimo 24h:* $${coin.market_data.low_24h.usd.toLocaleString()}\n` +
                        `📈 *Máximo 24h:* $${coin.market_data.high_24h.usd.toLocaleString()}\n` +
                        `🔝 *ATH:* $${coin.market_data.ath.usd.toLocaleString()}\n` +
                        `🔻 *ATL:* $${coin.market_data.atl.usd.toLocaleString()}\n\n` +
                        `💧 *Suministro Circulante:* ${(coin.market_data.circulating_supply / 1e6).toFixed(2)}M\n` +
                        `${coin.market_data.total_supply ? `🎯 *Suministro Total:* ${(coin.market_data.total_supply / 1e6).toFixed(2)}M\n` : ''}` +
                        `\n_Actualizado: ${new Date(coin.last_updated).toLocaleString()}_\n` +
                        `_Datos de CoinGecko API_`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: message +
                        `✦ *Precio USD:* $${coin.market_data.current_price.usd.toLocaleString()}\n` +
                        `✦ *Precio EUR:* €${coin.market_data.current_price.eur.toLocaleString()}\n\n` +
                        `✦ *Cambios:*\n` +
                        `${arrow24h} 24h: ${sign24h}${priceChange24h.toFixed(2)}%\n` +
                        `${arrow7d} 7d: ${sign7d}${priceChange7d.toFixed(2)}%\n` +
                        `${arrow30d} 30d: ${sign30d}${priceChange30d.toFixed(2)}%\n\n` +
                        `💹 *Market Cap:* $${(coin.market_data.market_cap.usd / 1e9).toFixed(2)}B\n` +
                        `🏆 *Ranking:* #${coin.market_cap_rank || 'N/A'}\n\n` +
                        `_Datos de CoinGecko API_`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error en crypto:', error);
            
            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: `《✿》Criptomoneda no encontrada.\n\n` +
                        `Usa el ID de CoinGecko. Ejemplos:\n` +
                        `✿ #crypto bitcoin\n` +
                        `✿ #crypto ethereum\n` +
                        `✿ #crypto cardano`
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `《✿》Error al obtener datos de criptomoneda.\n\n` +
                        `Intenta nuevamente en unos momentos.`
                });
            }
        }
    }
};
