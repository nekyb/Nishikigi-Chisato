// Codigo creado por: PanDev

import axios from 'axios'

const vozCommand = {
    name: 'voz',
    aliases: ['tts', 'speak', 'hablar'],
    category: 'tools',
    description: 'Convierte texto a voz usando ElevenLabs',
    usage: '#voz [texto]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    apiKeys: [
        'sk_f7e56db34985c2b95e2826c6b4517d6d2373b5bc2d5dc2ff',
        'sk_018b60c781a6d6c232a05ed65702a51b670b4ada40df119f'],
    
    currentKeyIndex: 0,
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid
        try {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗧𝗘𝗫𝗧 𝗧𝗢 𝗦𝗣𝗘𝗘𝗖𝗛 ✦
━━━━━━━━━━━━━━━━━━━━━

📝 *Uso:*
• #voz [texto]

📌 *Ejemplo:*
• #voz Hola, soy un bot

━━━━━━━━━━━━━━━━━━━━━
⚡ 𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺 𝘋𝘦𝘭𝘵𝘢𝘉𝘺𝘵𝘦`
                })
            }

            const text = args.join(' ')
            if (text.length > 1000) {
                return await sock.sendMessage(chatId, {
                    text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗘𝗥𝗥𝗢𝗥 ✦
━━━━━━━━━━━━━━━━━━━━━

❌ Texto muy largo (máx 1000 caracteres)

📊 Actual: ${text.length} caracteres
━━━━━━━━━━━━━━━━━━━━━`
                })
            }

            const audioBuffer = await this.generateSpeech(text)
            
            if (!audioBuffer || audioBuffer.length < 100) { 
                throw new Error('Audio buffer inválido o vacío')
            }

            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: true,
                waveform: new Array(30).fill(0).map(() => Math.floor(Math.random() * 100)),
                fileName: 'genesis.mp3',
                contextInfo: {
                    externalAdReply: {
                        title: "🎙️ | Text to Speech - Genesis",
                        body: "Powered by ElevenLabs AI",
                        thumbnailUrl: "https://i.ibb.co/XS9dQr0/elevenlabs.jpg",
                        sourceUrl: "https://elevenlabs.io",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg })
            
        } catch (error) {
            console.error('Error en comando voz:', error)
            await sock.sendMessage(chatId, {
                text: `━━━━━━━━━━━━━━━━━━━━━
    ✦ 𝗘𝗥𝗥𝗢𝗥 ✦
━━━━━━━━━━━━━━━━━━━━━

❌ Error al generar audio

━━━━━━━━━━━━━━━━━━━━━`
            })
        }
    },

    async generateSpeech(text) {
        const voices = [
            'pNInz6obpgDQGcFmaJgB', 
            'EXAVITQu4vr4xnSDxMaL', 
            '21m00Tcm4TlvDq8ikWAM', 
            'AZnzlk1XvdvUeBnXmlld', 
            'VR6AewLTigWG4xSOukaG', 
        ]

        const voiceId = voices[Math.floor(Math.random() * voices.length)]
        for (let i = 0; i < this.apiKeys.length; i++) {
            try {
                const apiKey = this.apiKeys[this.currentKeyIndex]
                const response = await axios.post(
                    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
                    {
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.71,
                            similarity_boost: 0.75,
                            style: 0.0,
                            use_speaker_boost: true
                        }
                    },
                    {
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': apiKey
                        },
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity
                    }
                )

                console.log(`✓ Audio generado con API key ${this.currentKeyIndex + 1}`)
                return Buffer.from(response.data)
            } catch (error) {
                console.error(`❌ API key ${this.currentKeyIndex + 1} falló:`, error.response?.status || error.message)
                this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length
                
                if (i === this.apiKeys.length - 1) {
                    console.error('❌ Todas las API keys fallaron')
                    throw error
                }
                
                console.log('⏳ Esperando antes de intentar con siguiente API key...')
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }

        return null
    }
}

export default vozCommand