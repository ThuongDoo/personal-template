/** Shape elements (torn paper, diamond, circle…): an outline that can be filled with a color or an image, drawn as inline SVG. */

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const randomSeed = () => Math.floor(Math.random() * 1e6) + 1

export const TORN_EDGES = [
  ['top', 'Mép trên'],
  ['bottom', 'Mép dưới'],
  ['left', 'Mép trái'],
  ['right', 'Mép phải'],
  ['diagonal', 'Chéo ↗ (giữ góc dưới phải)'],
  ['diagonal2', 'Chéo ↘ (giữ góc dưới trái)'],
]

/** Shape catalog. `props` overrides the shared shape defaults in elements.js. */
export const SHAPES = {
  torn: { label: 'Giấy rách', w: 400, h: 400, props: { rim: 7, rimColor: '#f8f8f6', texture: true, shadow: true } },
  diamond: { label: 'Hình thoi', w: 320, h: 320 },
  circle: { label: 'Hình tròn', w: 320, h: 320 },
  triangle: { label: 'Tam giác', w: 320, h: 300 },
  hexagon: { label: 'Lục giác', w: 340, h: 300 },
  star: { label: 'Ngôi sao', w: 320, h: 320 },
  arch: { label: 'Mái vòm', w: 300, h: 400 },
  heart: { label: 'Trái tim', w: 320, h: 300 },
  blob: { label: 'Hình cong', w: 340, h: 320 },
}
export const SHAPE_ORDER = Object.keys(SHAPES)

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const num = (v) => +v.toFixed(1)
const polygon = (pts) => 'M' + pts.map(([x, y]) => `${num(x)},${num(y)}`).join('L') + 'Z'

/** Stretches unit-space points (any bounding box) to fill w×h. */
function fitPoints(pts, w, h) {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)]
  const sx = w / (Math.max(...xs) - x0)
  const sy = h / (Math.max(...ys) - y0)
  return pts.map(([x, y]) => [(x - x0) * sx, (y - y0) * sy])
}

/** Closed smooth curve through the points (Catmull-Rom converted to cubic Béziers). */
function smoothClosed(pts) {
  const n = pts.length
  let d = `M${num(pts[0][0])},${num(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${num(c1[0])},${num(c1[1])} ${num(c2[0])},${num(c2[1])} ${num(p2[0])},${num(p2[1])}`
  }
  return d + 'Z'
}

/** Tear line from p0 to p1, `n` is the unit normal pointing away from the kept paper; `corners` close the shape. */
function edgeGeometry(edge, w, h, inset) {
  const d = Math.hypot(w, h)
  switch (edge) {
    case 'bottom':
      return { p0: [w, h - inset], p1: [0, h - inset], n: [0, 1], corners: [[0, 0], [w, 0]] }
    case 'left':
      return { p0: [inset, h], p1: [inset, 0], n: [-1, 0], corners: [[w, 0], [w, h]] }
    case 'right':
      return { p0: [w - inset, 0], p1: [w - inset, h], n: [1, 0], corners: [[0, h], [0, 0]] }
    case 'diagonal':
      return { p0: [0, h], p1: [w, 0], n: [-h / d, -w / d], corners: [[w, h]] }
    case 'diagonal2':
      return { p0: [0, 0], p1: [w, h], n: [h / d, -w / d], corners: [[0, h]] }
    default:
      return { p0: [0, inset], p1: [w, inset], n: [0, -1], corners: [[w, h], [0, h]] }
  }
}

/** Paper and rim outlines of a torn edge. Deterministic for a given seed so the tear doesn't change on re-render. */
function tornPaths(w, h, { edge, depth, tooth, rim, seed }) {
  const rand = rng(seed)
  const diagonal = edge.startsWith('diagonal')
  const { p0, p1, n, corners } = edgeGeometry(edge, w, h, diagonal ? 0 : depth + rim)
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])

  // Slow wander (control points every ~90px, smoothly interpolated) plus fine jagged teeth.
  const span = 90
  const knots = Array.from({ length: Math.ceil(len / span) + 2 }, () => rand() * 2 - 1)
  const wander = (t) => {
    const x = (t * len) / span
    const i = Math.floor(x)
    const f = x - i
    const s = f * f * (3 - 2 * f)
    return knots[i] * (1 - s) + knots[i + 1] * s
  }

  const paper = []
  const rimLine = []
  const at = (t, off) => [p0[0] + (p1[0] - p0[0]) * t + n[0] * off, p0[1] + (p1[1] - p0[1]) * t + n[1] * off]
  const step = Math.max(2, tooth)
  for (let dist = 0; ; ) {
    const t = Math.min(1, dist / len)
    const off = depth * (0.65 * wander(t) + 0.35 * (rand() * 2 - 1))
    paper.push(at(t, off))
    rimLine.push(at(t, off + rim * (0.3 + 0.9 * rand())))
    if (t >= 1) break
    dist += step * (0.4 + rand() * 0.9)
  }
  return { fill: polygon([...paper, ...corners]), rim: polygon([...rimLine, ...corners]) }
}

/**
 * Outline of a shape in a w×h box. Returns `{ fill, rim? }`: torn paper has its own rim outline,
 * other shapes get their rim as a stroke around `fill`.
 */
export function shapePaths(shape, w, h, p) {
  switch (shape) {
    case 'torn':
      return tornPaths(w, h, p)
    case 'diamond':
      return { fill: polygon([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]) }
    case 'triangle':
      return { fill: polygon([[w / 2, 0], [w, h], [0, h]]) }
    case 'hexagon':
      return { fill: polygon([[w / 4, 0], [(3 * w) / 4, 0], [w, h / 2], [(3 * w) / 4, h], [w / 4, h], [0, h / 2]]) }
    case 'star': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5 - Math.PI / 2
        const r = i % 2 ? 0.4 : 1
        return [Math.cos(a) * r, Math.sin(a) * r]
      })
      return { fill: polygon(fitPoints(pts, w, h)) }
    }
    case 'circle':
      return {
        fill: `M0,${h / 2}A${w / 2},${h / 2} 0 1 0 ${w},${h / 2}A${w / 2},${h / 2} 0 1 0 0,${h / 2}Z`,
      }
    case 'arch': {
      const ry = Math.min(w / 2, h)
      return { fill: `M0,${h}L0,${ry}A${w / 2},${ry} 0 0 1 ${w},${ry}L${w},${h}Z` }
    }
    case 'heart': {
      const X = (v) => num(v * w)
      const Y = (v) => num(v * h)
      return {
        fill:
          `M${X(0.5)},${Y(1)}C${X(0.1)},${Y(0.72)} 0,${Y(0.45)} 0,${Y(0.3)}` +
          `C0,${Y(0.13)} ${X(0.13)},0 ${X(0.28)},0C${X(0.39)},0 ${X(0.47)},${Y(0.07)} ${X(0.5)},${Y(0.16)}` +
          `C${X(0.53)},${Y(0.07)} ${X(0.61)},0 ${X(0.72)},0C${X(0.87)},0 ${w},${Y(0.13)} ${w},${Y(0.3)}` +
          `C${w},${Y(0.45)} ${X(0.9)},${Y(0.72)} ${X(0.5)},${Y(1)}Z`,
      }
    }
    case 'blob': {
      const rand = rng(p.seed)
      const pts = Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + rand() * 0.4
        const r = 0.72 + rand() * 0.28
        return [Math.cos(a) * r, Math.sin(a) * r]
      })
      // The smooth curve bulges past its points, so fit the points a little inside the box.
      const inner = fitPoints(pts, w * 0.9, h * 0.9).map(([x, y]) => [x + w * 0.05, y + h * 0.05])
      return { fill: smoothClosed(inner) }
    }
    default:
      return { fill: polygon([[0, 0], [w, 0], [w, h], [0, h]]) }
  }
}

/**
 * Where the image sits inside the box: scaled to cover it, times `imgZoom`, then shifted like CSS
 * object-position (`imgX`/`imgY` in %, 0 = left/top edge aligned, 100 = right/bottom). Null if the size is unknown.
 */
export function imageRect(w, h, p) {
  if (!p.imgW || !p.imgH) return null
  const s = Math.max(w / p.imgW, h / p.imgH) * (p.imgZoom || 1)
  const iw = p.imgW * s
  const ih = p.imgH * s
  return { x: ((w - iw) * p.imgX) / 100, y: ((h - ih) * p.imgY) / 100, w: iw, h: ih }
}

function imageTag(w, h, p, extra) {
  const r = imageRect(w, h, p)
  const box = r
    ? `x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" preserveAspectRatio="none"`
    : `x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"`
  return `<image href="${esc(p.src)}" ${box}${extra}/>`
}

/**
 * Returns the SVG markup; `id` must be unique in the document (used for clip-path/filter references).
 * `ghost` also draws the whole image faintly, to show what is cropped while positioning it.
 */
export function shapeSvg(el, id, { ghost = false } = {}) {
  const { w, h } = el
  const p = el.props
  const paths = shapePaths(p.shape, w, h, p)
  const clip = `${id}-clip`
  const shadow = `${id}-shadow`
  const tex = `${id}-tex`

  const defs = [`<clipPath id="${clip}"><path d="${paths.fill}"/></clipPath>`]
  if (p.shadow) {
    defs.push(
      `<filter id="${shadow}" x="-10%" y="-10%" width="120%" height="120%">` +
        `<feDropShadow dx="1.5" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/></filter>`,
    )
  }
  if (p.texture) {
    defs.push(
      `<filter id="${tex}" x="0" y="0" width="100%" height="100%">` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="${p.seed % 1000}" result="noise"/>` +
        `<feDiffuseLighting in="noise" surfaceScale="1.8" lighting-color="#fff" result="light">` +
        `<feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>` +
        `<feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.2" k2="0" k3="0" k4="0" result="lit"/>` +
        `<feComposite in="lit" in2="SourceGraphic" operator="in"/></filter>`,
    )
  }

  let rim = ''
  if (p.rim > 0) {
    const color = esc(p.rimColor)
    rim = paths.rim
      ? `<path d="${paths.rim}" fill="${color}"/>`
      : `<path d="${paths.fill}" fill="${color}" stroke="${color}" stroke-width="${p.rim * 2}" stroke-linejoin="round"/>`
  }
  const label = p.alt ? ` role="img" aria-label="${esc(p.alt)}"` : ' aria-hidden="true"'

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible"${label}>` +
    `<defs>${defs.join('')}</defs>` +
    (ghost && p.src ? imageTag(w, h, p, ' opacity="0.3"') : '') +
    `<g${p.shadow ? ` filter="url(#${shadow})"` : ''}><g${p.texture ? ` filter="url(#${tex})"` : ''}>` +
    rim +
    `<path d="${paths.fill}" fill="${esc(el.style.background)}"/>` +
    (p.src ? imageTag(w, h, p, ` clip-path="url(#${clip})"`) : '') +
    `</g></g></svg>`
  )
}

/** Props for putting a freshly read image ({ src, width, height }) into a shape, re-centered. */
export const shapeImageProps = (img, name = '') => ({
  src: img.src,
  alt: name.replace(/\.[^.]+$/, ''),
  imgW: img.width,
  imgH: img.height,
  imgX: 50,
  imgY: 50,
  imgZoom: 1,
})

export const IMG_ZOOM_MIN = 0.2
export const IMG_ZOOM_MAX = 5

/**
 * Props for zooming the image to `zoom`, keeping the image point under (px, py) — box coordinates,
 * default the center — where it is. Below 1 the image is smaller than the box and stays inside it.
 */
export function zoomImageAt(w, h, p, zoom, px = w / 2, py = h / 2) {
  const imgZoom = Math.min(IMG_ZOOM_MAX, Math.max(IMG_ZOOM_MIN, zoom))
  const r = imageRect(w, h, p)
  if (!r) return { imgZoom }
  const k = imgZoom / (p.imgZoom || 1)
  // New top-left so the anchor keeps its position, converted back to object-position percentages.
  const pct = (anchor, pos, size, box, prev) => {
    const span = box - size * k
    if (Math.abs(span) < 0.5) return prev
    const next = ((anchor - (anchor - pos) * k) * 100) / span
    return Math.round(Math.min(100, Math.max(0, next)) * 10) / 10
  }
  return { imgZoom, imgX: pct(px, r.x, r.w, w, p.imgX), imgY: pct(py, r.y, r.h, h, p.imgY) }
}
