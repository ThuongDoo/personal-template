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

/**
 * Reads an image file into a blob ready to upload, downscaling large photos. SVG/GIF are kept
 * as-is (re-encoding would lose vectors/animation).
 */
export async function readImageFile(file, maxSize = 1600) {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const width = img.naturalWidth || 300
    const height = img.naturalHeight || 200
    const ratio = Math.min(1, maxSize / Math.max(width, height))
    const keepOriginal =
      file.type === 'image/svg+xml' || file.type === 'image/gif' || (ratio === 1 && file.size < 300_000)
    if (keepOriginal) return { blob: file, width, height }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
    if (!blob) throw new Error('Không nén được ảnh')
    return { blob, width: canvas.width, height: canvas.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}
