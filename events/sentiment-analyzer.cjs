const { GoogleGenerativeAI } = require('@google/generative-ai')
const Sentiment = require('sentiment')

const sentimentAnalyzer = new Sentiment()
class SentimentAnalyzer {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey)
        this.model = null}

    async initialize() {try {this.model = this.genAI.getGenerativeModel({ 
                model: 'gemini-1.5-flash',
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 150}})
            console.log('✅ Sentiment Analyzer inicializado')} catch (error) {console.error('❌ Error inicializando Sentiment Analyzer:', error)}}

    async analyzeWithGemini(text) {if (!this.model) {await this.initialize()}
        const prompt = `Analiza el siguiente mensaje y determina:
1. Sentimiento principal (positivo, negativo, neutral)
2. Intensidad emocional (0-100)
3. Emoción dominante (alegría, tristeza, enojo, frustración, neutral)
4. ¿Contiene lenguaje agresivo u ofensivo? (sí/no)
5. ¿Es parte de un conflicto? (sí/no)

Mensaje: "${text}"

Responde SOLO en formato JSON así:
{
  "sentiment": "positivo|negativo|neutral",
  "intensity": 0-100,
  "emotion": "alegría|tristeza|enojo|frustración|neutral",
  "isAggressive": true|false,
  "isConflict": true|false
}`

        try {
            const result = await this.model.generateContent(prompt)
            const response = result.response.text()
            const jsonText = response.replace(/```json\n?|\n?```/g, '').trim()
            const analysis = JSON.parse(jsonText)
            return {
                tone: analysis.sentiment,
                intensity: analysis.intensity / 100,
                emotion: analysis.emotion,
                isAggressive: analysis.isAggressive,
                isConflict: analysis.isConflict,
                source: 'gemini'}} catch (error) {console.error('Error en análisis Gemini:', error)
            return this.analyzeLocal(text)}}
    analyzeLocal(text) {const result = sentimentAnalyzer.analyze(text)
        const normalizedScore = (result.score + 5) / 10
        return {
            tone: result.score > 1 ? 'positivo' : result.score < -1 ? 'negativo' : 'neutral',
            intensity: Math.abs(result.score) / 5,
            emotion: result.score > 2 ? 'alegría' : result.score < -2 ? 'enojo' : 'neutral',
            isAggressive: result.negative.length > 2,
            isConflict: result.score < -2,
            source: 'local'}}

    async analyze(text) {
        try {
            return await this.analyzeWithGemini(text)} catch (error) {console.error('Fallback a análisis local')
            return this.analyzeLocal(text)}}

    async analyzeMessages(messages) {const analyses = []
        for (const msg of messages) {const analysis = await this.analyze(msg.text)
            analyses.push({
                ...msg,
                analysis})}
        return analyses}

    calculateGroupTension(analyses) {if (analyses.length === 0) return 0
        let totalTension = 0
        let negativeCount = 0
        let aggressiveCount = 0
        let conflictCount = 0
        analyses.forEach(msg => {
            const { analysis } = msg
            if (analysis.tone === 'negativo') {
                totalTension += analysis.intensity * 30
                negativeCount++}
            
            if (analysis.isAggressive) {
                totalTension += 25
                aggressiveCount++}
            
            if (analysis.isConflict) {
                totalTension += 20
                conflictCount++}})
        let tension = totalTension / analyses.length
        if (negativeCount >= 3) tension *= 1.3
        if (aggressiveCount >= 2) tension *= 1.5
        if (conflictCount >= 2) tension *= 1.8
        return Math.min(100, Math.round(tension))}}

module.exports = SentimentAnalyzer