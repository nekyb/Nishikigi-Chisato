import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function clearCache() {
    try {
        // En ESM, no podemos limpiar la caché directamente como en CommonJS
        // Pero podemos forzar una recarga usando timestamps en las URLs
        global._lastUpdate = Date.now()
        
        // También podemos invalidar módulos dinámicamente importados
        if (global._dynamicImports) {
            global._dynamicImports.clear()
        }

        return true
    } catch (error) {
        console.error('Error limpiando caché:', error)
        throw error
    }
}