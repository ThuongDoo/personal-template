import { AUDIO_PRESETS } from './audioViz.js'
import { firstColor, isGradient } from './gradient.js'
import { SHAPES, randomSeed } from './shapes.js'

export const GRID = 10
export const DND_TYPE = 'application/x-builder-element'
export const TEXT_TYPES = ['heading', 'text', 'button']

export const uid = () => Math.random().toString(36).slice(2, 9)
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const FONTS = [
  { value: 'be-vietnam', label: 'Be Vietnam Pro', stack: "'Be Vietnam Pro', system-ui, sans-serif" },
  { value: 'inter', label: 'Inter', stack: "'Inter', system-ui, sans-serif" },
  { value: 'montserrat', label: 'Montserrat', stack: "'Montserrat', system-ui, sans-serif" },
  { value: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', Georgia, serif" },
  { value: 'lora', label: 'Lora', stack: "'Lora', Georgia, serif" },
  { value: 'system', label: 'Hệ thống', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { value: 'mono', label: 'Monospace', stack: 'ui-monospace, Consolas, monospace' },
]

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400' +
  '&family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400' +
  '&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400' +
  '&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap'

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 3px rgba(15, 23, 42, 0.12)',
  md: '0 8px 20px rgba(15, 23, 42, 0.12)',
  lg: '0 20px 48px rgba(15, 23, 42, 0.2)',
}

const VALIGN = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }

export const BASE_STYLE = {
  background: 'transparent',
  color: '#111827',
  fontFamily: 'be-vietnam',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: 'left',
  verticalAlign: 'top',
  italic: false,
  underline: false,
  padding: 0,
  radius: 0,
  borderWidth: 0,
  borderColor: '#d1d5db',
  borderStyle: 'solid',
  shadow: 'none',
  opacity: 1,
  lineWidth: 2,
  lineStyle: 'solid',
}

export const ELEMENT_TYPES = {
  heading: {
    label: 'Tiêu đề',
    w: 520,
    h: 60,
    props: { text: 'Tiêu đề của bạn' },
    style: { fontSize: 40, fontWeight: 700, lineHeight: 1.2 },
  },
  text: {
    label: 'Đoạn văn',
    w: 420,
    h: 100,
    props: {
      text: 'Nhấp đúp để chỉnh sửa đoạn văn này. Bạn có thể đổi phông chữ, cỡ chữ và màu sắc ở bảng bên phải.',
    },
    style: { color: '#4b5563', lineHeight: 1.6 },
  },
  button: {
    label: 'Nút bấm',
    w: 180,
    h: 52,
    props: { text: 'Nhấn vào đây', href: '#', newTab: false },
    style: {
      background: '#4f46e5',
      color: '#ffffff',
      fontWeight: 600,
      textAlign: 'center',
      verticalAlign: 'middle',
      radius: 10,
      padding: 8,
    },
  },
  image: {
    label: 'Hình ảnh',
    w: 360,
    h: 240,
    props: { src: '', alt: '', fit: 'cover' },
    style: { radius: 12 },
  },
  box: {
    label: 'Khối màu',
    w: 300,
    h: 200,
    props: {},
    style: { background: '#eef2ff', radius: 16 },
  },
  divider: {
    label: 'Đường kẻ',
    w: 400,
    h: 20,
    props: {},
    style: { color: '#d1d5db' },
  },
  shape: {
    label: 'Hình khối',
    w: 320,
    h: 320,
    props: {
      shape: 'diamond',
      // What fills the shape: 'image' or 'video' (src is either); imgW/imgX/… frame both.
      mediaType: 'image',
      src: '',
      alt: '',
      imgW: 0,
      imgH: 0,
      imgX: 50,
      imgY: 50,
      imgZoom: 1,
      rim: 0,
      rimColor: '#ffffff',
      texture: false,
      shadow: false,
      seed: 0,
      // Torn paper only.
      edge: 'diagonal',
      depth: 14,
      tooth: 14,
    },
    initProps: () => ({ seed: randomSeed() }),
    style: { background: '#2f5597' },
  },
  video: {
    label: 'Video YouTube',
    w: 480,
    h: 270,
    props: { url: '' },
    style: { radius: 12, background: '#0f172a' },
  },
  audio: {
    label: 'Âm thanh',
    w: 420,
    h: 140,
    // viz: one of AUDIO_PRESETS in audioViz.js, which also draws it (mountAudio).
    props: { src: '', name: '', viz: 'bars', color: '#a78bfa', color2: '#f472b6', bars: 32, loop: false, autoplay: true },
    style: { radius: 16, background: 'transparent' },
  },
  icon: {
    label: 'Nút icon',
    w: 56,
    h: 56,
    // icon: a key of ICON_LIBRARY (iconLibrary.js); iconSize is a % of the box.
    props: { icon: 'phone', iconColor: '#ffffff', iconSize: 50, strokeWidth: 2, href: '#', newTab: false, label: '' },
    style: { background: '#4f46e5', radius: 999 },
  },
}

export const PALETTE_ORDER = ['image', 'box', 'divider', 'video']

/**
 * The text group in the palette (`text:<preset>`): ready-made heading/paragraph elements that only
 * differ in their starting size, content and style, so they need nothing new to render or publish.
 */
export const TEXT_PRESETS = {
  title: {
    label: 'Tiêu đề lớn',
    type: 'heading',
    w: 680,
    h: 72,
    props: { text: 'Tiêu đề lớn của bạn' },
    style: { fontSize: 54, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1 },
  },
  heading: { label: 'Tiêu đề', type: 'heading' },
  subheading: {
    label: 'Tiêu đề phụ',
    type: 'heading',
    w: 480,
    h: 40,
    props: { text: 'Tiêu đề phụ' },
    style: { fontSize: 24, fontWeight: 600, lineHeight: 1.3, color: '#374151' },
  },
  paragraph: { label: 'Đoạn văn', type: 'text' },
  quote: {
    label: 'Trích dẫn',
    type: 'text',
    w: 460,
    h: 104,
    props: { text: '“Một câu nói truyền cảm hứng đặt ở đây.”\n— Tên tác giả' },
    style: { fontSize: 20, italic: true, lineHeight: 1.5, color: '#374151', background: '#f5f3ff', padding: 20, radius: 12 },
  },
  list: {
    label: 'Danh sách',
    type: 'text',
    w: 360,
    h: 110,
    props: { text: '•  Mục thứ nhất\n•  Mục thứ hai\n•  Mục thứ ba' },
    style: { lineHeight: 1.8, color: '#374151' },
  },
  caption: {
    label: 'Chú thích',
    type: 'text',
    w: 320,
    h: 24,
    props: { text: 'Chú thích nhỏ cho ảnh hoặc nội dung' },
    style: { fontSize: 13, color: '#9ca3af', lineHeight: 1.4 },
  },
  label: {
    label: 'Nhãn',
    type: 'text',
    w: 220,
    h: 22,
    props: { text: 'NHÃN NỔI BẬT' },
    style: { fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#4f46e5' },
  },
}
export const TEXT_ORDER = Object.keys(TEXT_PRESETS)

/** The button group in the palette (`button:<preset>`), built the same way as TEXT_PRESETS. */
export const BUTTON_PRESETS = {
  primary: { label: 'Nút chính', type: 'button' },
  outline: {
    label: 'Viền',
    type: 'button',
    style: { background: 'transparent', color: '#4f46e5', borderWidth: 2, borderColor: '#4f46e5' },
  },
  pill: { label: 'Bo tròn', type: 'button', style: { background: '#111827', radius: 999 } },
  soft: { label: 'Nhạt', type: 'button', style: { background: '#eef2ff', color: '#4f46e5' } },
  gradient: {
    label: 'Chuyển màu',
    type: 'button',
    style: { background: 'linear-gradient(135deg, #6366f1, #ec4899)', radius: 999 },
  },
  raised: {
    label: 'Nổi',
    type: 'button',
    style: { background: '#ffffff', color: '#111827', shadow: 'lg', radius: 12 },
  },
  link: {
    label: 'Liên kết',
    type: 'button',
    w: 140,
    h: 32,
    props: { text: 'Xem thêm →' },
    style: { background: 'transparent', color: '#4f46e5', underline: true, padding: 0 },
  },
  large: {
    label: 'Nút lớn',
    type: 'button',
    w: 280,
    h: 68,
    props: { text: 'Bắt đầu ngay' },
    style: { fontSize: 20, fontWeight: 700, radius: 14, shadow: 'md' },
  },
  icon: { label: 'Nút icon', type: 'icon' },
  iconPlain: {
    label: 'Icon',
    type: 'icon',
    w: 44,
    h: 44,
    props: { icon: 'facebook', iconColor: '#4f46e5', iconSize: 80 },
    style: { background: 'transparent' },
  },
}
export const BUTTON_ORDER = Object.keys(BUTTON_PRESETS)

/** Palette groups whose presets are plain elements with a different starting style. */
const STYLE_PRESETS = { text: TEXT_PRESETS, button: BUTTON_PRESETS }

/**
 * Palette/drag key → new element. Keys are element types, `shape:<name>` for a shape preset (size and
 * props from the SHAPES catalog), `audio:<viz>` for an audio effect (from AUDIO_PRESETS), or
 * `text:<preset>` / `button:<preset>` for a text or button style (TEXT_PRESETS, BUTTON_PRESETS).
 */
export function createFromKey(key, rest = {}) {
  const [type, preset] = key.split(':')
  const styled = STYLE_PRESETS[type]?.[preset]
  if (styled) {
    const { type: kind, w, h, props, style } = styled
    const base = ELEMENT_TYPES[kind]
    return createElement(kind, {
      w: w ?? base.w,
      h: h ?? base.h,
      ...rest,
      props: { ...props, ...rest.props },
      style: { ...style, ...rest.style },
    })
  }
  if (type === 'shape' && SHAPES[preset]) {
    const s = SHAPES[preset]
    return createElement('shape', { w: s.w, h: s.h, ...rest, props: { ...s.props, shape: preset, ...rest.props } })
  }
  if (type === 'audio' && AUDIO_PRESETS[preset]) {
    const a = AUDIO_PRESETS[preset]
    return createElement('audio', { w: a.w, h: a.h, ...rest, props: { ...a.props, viz: preset, ...rest.props } })
  }
  return createElement(type, rest)
}

export function createElement(type, { props, style, ...rest } = {}) {
  const t = ELEMENT_TYPES[type]
  return {
    id: uid(),
    type,
    x: 0,
    y: 0,
    w: t.w,
    h: t.h,
    rotation: 0,
    hidden: false,
    locked: false,
    ...rest,
    props: { ...t.props, ...t.initProps?.(), ...props },
    style: { ...BASE_STYLE, ...t.style, ...style },
  }
}

export function applyPatch(el, patch) {
  return {
    ...el,
    ...patch,
    props: { ...el.props, ...patch.props },
    style: { ...el.style, ...patch.style },
  }
}

export const DEFAULT_PAGE = { title: 'Trang web của tôi', favicon: '', width: 1200, height: 1000, background: '#ffffff' }

/** Validates a loaded/imported document and fills in any missing defaults. */
export function normalizeDoc(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.elements)) throw new Error('Invalid document')
  const page = { ...DEFAULT_PAGE, ...raw.page }
  const elements = raw.elements
    // Torn paper used to be its own element type.
    .map((el) => (el?.type === 'torn' ? { ...el, type: 'shape', props: { ...el.props, shape: 'torn' } } : el))
    .filter((el) => el && ELEMENT_TYPES[el.type])
    .map((el) => createElement(el.type, { ...el, id: el.id || uid() }))
  return { page, elements }
}

/** Display name of an element's kind (shapes and audio show their preset, e.g. "Hình thoi"). */
export function elementLabel(el) {
  return (
    (el.type === 'shape' && SHAPES[el.props.shape]?.label) ||
    (el.type === 'audio' && AUDIO_PRESETS[el.props.viz] && `Âm thanh · ${AUDIO_PRESETS[el.props.viz].label}`) ||
    ELEMENT_TYPES[el.type].label
  )
}

export function fontStack(value) {
  return (FONTS.find((f) => f.value === value) ?? FONTS[0]).stack
}

export function youtubeEmbed(url) {
  const m = /(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/.exec(url || '')
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

/** Style for the inner content box of an element (the outer wrapper handles position/size). */
export function contentStyle(el) {
  const s = el.style
  const css = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    margin: 0,
    background: s.background,
    borderRadius: s.radius,
    opacity: s.opacity,
    boxShadow: SHADOWS[s.shadow] ?? 'none',
    // A gradient border is drawn by an overlay (gradientBorderStyle); this transparent one keeps the layout.
    border:
      s.borderWidth > 0
        ? `${s.borderWidth}px ${s.borderStyle} ${isGradient(s.borderColor) ? 'transparent' : s.borderColor}`
        : 'none',
    padding: s.padding,
    overflow: 'hidden',
  }
  if (TEXT_TYPES.includes(el.type)) {
    Object.assign(css, {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: VALIGN[s.verticalAlign] ?? 'flex-start',
      // Gradient text is painted by an inner span (textGradientStyle); this is the fallback colour.
      color: firstColor(s.color),
      fontFamily: fontStack(s.fontFamily),
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      textAlign: s.textAlign,
      fontStyle: s.italic ? 'italic' : 'normal',
      textDecoration: s.underline ? 'underline' : 'none',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
    })
  }
  if (el.type === 'divider') {
    Object.assign(css, { display: 'flex', alignItems: 'center' })
  }
  if (el.type === 'icon') {
    Object.assign(css, { display: 'flex', alignItems: 'center', justifyContent: 'center' })
  }
  if (el.type === 'shape') {
    // The SVG draws its own fill, rim and shadow, and the shadow must spill past the box.
    // position: relative anchors a video layered over the SVG.
    Object.assign(css, { position: 'relative', background: 'none', border: 'none', boxShadow: 'none', borderRadius: 0, padding: 0, overflow: 'visible' })
  }
  return css
}

export function dividerLineStyle(el) {
  const { lineWidth: w, lineStyle, color } = el.style
  if (!isGradient(color)) return { width: '100%', borderTop: `${w}px ${lineStyle} ${color}` }
  // Borders can't be gradients: draw a gradient bar and cut dashes/dots out of it with a mask.
  const css = { width: '100%', height: w, background: color }
  if (lineStyle !== 'solid') {
    const [on, off] = lineStyle === 'dotted' ? [w, w] : [w * 3, w * 2]
    const mask = `repeating-linear-gradient(90deg, #000 0 ${on}px, transparent ${on}px ${on + off}px)`
    Object.assign(css, { WebkitMask: mask, mask })
  }
  return css
}
