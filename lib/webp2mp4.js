import fetch from 'node-fetch';
import {
    FormData,
    Blob
} from 'formdata-node';
import {
    JSDOM
} from 'jsdom';
/**
 * 
 * @param {Buffer|String} source 
 */
async function webp2mp4(source) {
    let form = new FormData()
    let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
    const blob = !isUrl && new Blob([source.toArrayBuffer()])
    form.append('new-image-url', isUrl ? blob : '')
    form.append('new-image', isUrl ? '' : blob, 'image.webp')
    let res = await fetch('https://ezgif.com/webp-to-mp4', {
        method: 'POST',
        body: form
    })
    let html = await res.text()
    let {
        document
    } = new JSDOM(html).window
    let form2 = new FormData()
    let obj = {}
    for (let input of document.querySelectorAll('form input[name]')) {
        obj[input.name] = input.value
        form2.append(input.name, input.value)
    }
    let res2 = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, {
        method: 'POST',
        body: form2
    })
    let html2 = await res2.text()
    let {
        document: document2
    } = new JSDOM(html2).window
    return new URL(document2.querySelector('div#output > p.outfile > video > source').src, res2.url).toString()
}

async function webp2png(source) {
    let form = new FormData()
    let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
    
    // Convertir Uint8Array o Buffer a Blob correctamente
    let blob;
    if (!isUrl) {
        if (source instanceof Uint8Array || Buffer.isBuffer(source)) {
            blob = new Blob([source], { type: 'image/webp' })
        } else if (source.toArrayBuffer) {
            blob = new Blob([source.toArrayBuffer()], { type: 'image/webp' })
        } else {
            blob = new Blob([source], { type: 'image/webp' })
        }
    }
    
    form.append('new-image-url', isUrl ? source : '')
    form.append('new-image', isUrl ? '' : blob, 'image.webp')
    
    let res = await fetch('https://ezgif.com/webp-to-png', {
        method: 'POST',
        body: form
    })
    let html = await res.text()
    let {
        document
    } = new JSDOM(html).window
    let form2 = new FormData()
    let obj = {}
    
    for (let input of document.querySelectorAll('form input[name]')) {
        obj[input.name] = input.value
        form2.append(input.name, input.value)
    }
    
    if (!obj.file) {
        throw new Error('No se pudo obtener el archivo de conversión desde ezgif')
    }
    
    let res2 = await fetch('https://ezgif.com/webp-to-png/' + obj.file, {
        method: 'POST',
        body: form2
    })
    let html2 = await res2.text()
    let {
        document: document2
    } = new JSDOM(html2).window
    
    // Intentar múltiples selectores
    let imgElement = document2.querySelector('div#output > p.outfile > img') ||
                     document2.querySelector('img[src*="webp"]') ||
                     document2.querySelector('img')
    
    if (!imgElement || !imgElement.src) {
        console.error('HTML response:', html2.substring(0, 500))
        throw new Error('No se encontró imagen en la respuesta de conversión')
    }
    
    return new URL(imgElement.src, res2.url).toString()
}

export {
    webp2mp4,
    webp2png
}
// By @nm9h
