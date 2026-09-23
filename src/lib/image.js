function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không tải được ảnh'))
    img.src = src
  })
}

export async function loadImageSize(src) {
  const img = await loadImage(src)
  return { width: img.naturalWidth || 300, height: img.naturalHeight || 200 }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Reads an image file into a data URL, downscaling large photos so the page still fits in
 * localStorage. SVG/GIF are kept as-is (re-encoding would lose vectors/animation).
 */
export async function readImageFile(file, maxSize = 1600) {
  const dataUrl = await readAsDataUrl(file)
  const img = await loadImage(dataUrl)
  const width = img.naturalWidth || 300
  const height = img.naturalHeight || 200
  const ratio = Math.min(1, maxSize / Math.max(width, height))
  const keepOriginal =
    file.type === 'image/svg+xml' || file.type === 'image/gif' || (ratio === 1 && file.size < 300_000)
  if (keepOriginal) return { src: dataUrl, width, height }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return { src: canvas.toDataURL('image/webp', 0.85), width: canvas.width, height: canvas.height }
}
