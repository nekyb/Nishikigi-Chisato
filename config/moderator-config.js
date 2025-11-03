export const moderatorConfig = {
    sensitivity: 'medium', // low, medium, high
    thresholds: {
        observe: 25,      // Solo observar
        hint: 40,         // Mensaje sutil
        warn: 60,         // Advertencia clara
        alert: 80         // Alertar admins
    },
    
    messageBufferSize: 15,           // Últimos N mensajes a analizar
    analysisInterval: 3,             // Analizar cada N mensajes nuevos
    interventionCooldown: 180000,   
    
    // Palabras clave ponderadas
    keywords: {
        high: ['idiota', 'imbécil', 'estúpido', 'pendejo', 'maldito'],
        medium: ['cállate', 'vete', 'odio', 'fastidioso', 'pesado'],
        low: ['tonto', 'ridículo', 'absurdo']
    },
    
    escalationPatterns: {
        rapidNegativeChange: 0.6,     // Cambio de +0.5 a -0.5 en 3 msgs
        repeatedNegative: 4,           // 4+ mensajes negativos seguidos
        multipleUsers: 3,              // 3+ usuarios con sentimiento negativo
        rapidFireMessages: 5           // 5+ mensajes en 30 segundos
    },
    
    ai: {
        model: 'gemini-1.5-pro',
        temperature: 0.3,              
        maxTokens: 150
    },
    
    // Opciones
    analyzeAdmins: false,              // ¿Analizar mensajes de admins?
    learningMode: false,               // Modo observación (no interviene)
    logAnalysis: true,                 // Guardar análisis en BD
    
    messages: {
        observe: null,
        hint: [
            '😊 Hey, recordemos mantener el respeto mutuo',
            '💭 Tomemos las cosas con calma',
            '🌟 El grupo es más divertido cuando todos nos llevamos bien'
        ],
        warn: [
            '⚠️ Ey, noto que la conversación se está poniendo tensa. ¿Podemos bajarle un poco?',
            '🤔 Parece que hay un malentendido. ¿Quieren que llame a un admin o lo resuelven ustedes?',
            '😅 Creo que esto se está saliendo de control. Mejor calmemos las aguas'
        ],
        alert: [
            '🚨 Admins, necesito ayuda aquí. La situación se está poniendo seria',
            '⚠️ @admins hay un conflicto que requiere su atención'
        ]
    }
}

export default moderatorConfig