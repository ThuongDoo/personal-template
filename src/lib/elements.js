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
  video: {
    label: 'Video YouTube',
    w: 480,
    h: 270,
    props: { url: '' },
    style: { radius: 12, background: '#0f172a' },
  },
}

export const PALETTE_ORDER = ['heading', 'text', 'button', 'image', 'box', 'divider', 'video']

export function createElement(type, { props, style, ...rest } = {}) {
  const t = ELEMENT_TYPES[type]
  return {
    id: uid(),
    type,
    x: 0,
    y: 0,
    w: t.w,
    h: t.h,
    hidden: false,
    locked: false,
    ...rest,
    props: { ...t.props, ...props },
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

export const DEFAULT_PAGE = { title: 'Trang web của tôi', width: 1200, height: 1000, background: '#ffffff' }

/** Validates a loaded/imported document and fills in any missing defaults. */
export function normalizeDoc(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.elements)) throw new Error('Invalid document')
  const page = { ...DEFAULT_PAGE, ...raw.page }
  const elements = raw.elements
    .filter((el) => el && ELEMENT_TYPES[el.type])
    .map((el) => createElement(el.type, { ...el, id: el.id || uid() }))
  return { page, elements }
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
    border: s.borderWidth > 0 ? `${s.borderWidth}px ${s.borderStyle} ${s.borderColor}` : 'none',
    padding: s.padding,
    overflow: 'hidden',
  }
  if (TEXT_TYPES.includes(el.type)) {
    Object.assign(css, {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: VALIGN[s.verticalAlign] ?? 'flex-start',
      color: s.color,
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
  return css
}

export function dividerLineStyle(el) {
  return { width: '100%', borderTop: `${el.style.lineWidth}px ${el.style.lineStyle} ${el.style.color}` }
}
