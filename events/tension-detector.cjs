class TensionDetector {
    constructor(config) {
        this.config = config
    }

    detectEscalation(analyzedMessages) {
        const patterns = {
            rapidNegativeChange: false,
            repeatedNegative: false,
            multipleUsersInvolved: false,
            rapidFireMessages: false
        }
        
        const recentMessages = analyzedMessages.slice(-10)
        if (recentMessages.length >= 3) {
            const first = recentMessages[0].analysis
            const last = recentMessages[recentMessages.length - 1].analysis
            const sentimentChange = this.getSentimentValue(first.tone) - this.getSentimentValue(last.tone)
            if (sentimentChange >= this.config.escalationPatterns.rapidNegativeChange) {
                patterns.rapidNegativeChange = true
            }
        }
        
        const consecutiveNegative = this.countConsecutiveNegative(recentMessages)
        if (consecutiveNegative >= this.config.escalationPatterns.repeatedNegative) {patterns.repeatedNegative = true}
        const negativeUsers = new Set()
        recentMessages.forEach(msg => {
            if (msg.analysis.tone === 'negativo') {
                negativeUsers.add(msg.userId)
            }
        })
        
        if (negativeUsers.size >= this.config.escalationPatterns.multipleUsers) {
            patterns.multipleUsersInvolved = true
        }
        
        if (recentMessages.length >= 5) {
            const timeSpan = recentMessages[recentMessages.length - 1].timestamp - recentMessages[0].timestamp
            if (timeSpan < 30000) { 
                patterns.rapidFireMessages = true
            }
        }
        
        return patterns
    }

    getSentimentValue(tone) {
        const values = {
            'positivo': 1,
            'neutral': 0,
            'negativo': -1
        }
        return values[tone] || 0
    }

    countConsecutiveNegative(messages) {
        let count = 0
        let maxCount = 0
        
        for (const msg of messages) {
            if (msg.analysis.tone === 'negativo') {
                count++
                maxCount = Math.max(maxCount, count)
            } else {
                count = 0
            }
        }
        
        return maxCount
    }

    getInvolvedUsers(analyzedMessages) {
        const userScores = {}
        
        analyzedMessages.forEach(msg => {
            const userId = msg.userId
            if (!userScores[userId]) {
                userScores[userId] = {
                    negativeCount: 0,
                    aggressiveCount: 0,
                    totalMessages: 0
                }
            }
            
            userScores[userId].totalMessages++
            
            if (msg.analysis.tone === 'negativo') {
                userScores[userId].negativeCount++
            }
            
            if (msg.analysis.isAggressive) {
                userScores[userId].aggressiveCount++
            }
        })
        
        return Object.keys(userScores).filter(userId => {
            const score = userScores[userId]
            return score.negativeCount >= 2 || score.aggressiveCount >= 1
        })}

    getInterventionLevel(tensionLevel, patterns) {
        let adjustedTension = tensionLevel
        if (patterns.rapidNegativeChange) adjustedTension += 15
        if (patterns.repeatedNegative) adjustedTension += 10
        if (patterns.multipleUsersInvolved) adjustedTension += 20
        if (patterns.rapidFireMessages) adjustedTension += 10  
        adjustedTension = Math.min(100, adjustedTension)
        const { thresholds } = this.config
        if (adjustedTension >= thresholds.alert) return 'alert'
        if (adjustedTension >= thresholds.warn) return 'warn'
        if (adjustedTension >= thresholds.hint) return 'hint'
        if (adjustedTension >= thresholds.observe) return 'observe'
        return 'none'}}

module.exports = TensionDetector