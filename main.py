import os
import re

def buscar_isBotAdmin(directorio='.'):
    print("🔍 Buscando 'isBotAdmin' en todos los archivos...\n")
    
    archivos_encontrados = []
    
    for root, dirs, files in os.walk(directorio):
        # Ignorar node_modules y carpetas ocultas
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        
        for file in files:
            if file.endswith(('.js', '.ts', '.json')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        contenido = f.read()
                        lineas = contenido.split('\n')
                        
                        for num_linea, linea in enumerate(lineas, 1):
                            if 'isBotAdmin' in linea:
                                archivos_encontrados.append({
                                    'archivo': filepath,
                                    'linea': num_linea,
                                    'contenido': linea.strip()
                                })
                except Exception as e:
                    continue
    
    if archivos_encontrados:
        print(f"✅ Se encontraron {len(archivos_encontrados)} referencias:\n")
        
        archivo_actual = None
        for item in archivos_encontrados:
            if archivo_actual != item['archivo']:
                archivo_actual = item['archivo']
                print(f"\n📁 {item['archivo']}")
            print(f"   Línea {item['linea']}: {item['contenido']}")
    else:
        print("❌ No se encontraron referencias a 'isBotAdmin'")

if __name__ == "__main__":
    buscar_isBotAdmin()