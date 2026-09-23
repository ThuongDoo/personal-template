import { createElement } from './elements.js'

const el = (type, x, y, w, h, props, style) => createElement(type, { x, y, w, h, props, style })
const photo = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`

function landing() {
  const accent = '#4f46e5'
  const card = (x, title, body) => [
    el('box', x, 770, 320, 200, {}, { background: '#ffffff', radius: 18, shadow: 'md' }),
    el('heading', x + 28, 800, 264, 36, { text: title }, { fontSize: 22, fontWeight: 700 }),
    el('text', x + 28, 846, 264, 100, { text: body }, { fontSize: 15, color: '#6b7280', lineHeight: 1.6 }),
  ]
  return {
    page: { title: 'Studio Mây', width: 1200, height: 1180, background: '#ffffff' },
    elements: [
      el('heading', 80, 32, 240, 40, { text: 'Studio Mây' }, { fontSize: 24, fontWeight: 800, color: accent, verticalAlign: 'middle' }),
      el('text', 560, 32, 400, 40, { text: 'Dịch vụ      Dự án      Liên hệ' }, { fontSize: 15, fontWeight: 500, color: '#374151', textAlign: 'right', verticalAlign: 'middle' }),
      el('button', 1000, 28, 120, 46, { text: 'Bắt đầu' }, { fontSize: 15, radius: 999, background: '#111827' }),

      el('heading', 80, 170, 540, 150, { text: 'Tạo trang web của bạn chỉ trong vài phút' }, { fontSize: 54, fontWeight: 800, lineHeight: 1.12, letterSpacing: -1 }),
      el('text', 80, 350, 480, 84, { text: 'Kéo thả các thành phần, chỉnh sửa trực quan và xem trước ngay lập tức. Không cần viết một dòng code nào.' }, { fontSize: 18, color: '#4b5563', lineHeight: 1.6 }),
      el('button', 80, 470, 210, 56, { text: 'Dùng thử miễn phí' }, { background: accent, radius: 12, fontSize: 16 }),
      el('button', 306, 470, 170, 56, { text: 'Xem mẫu' }, { background: 'transparent', color: accent, borderWidth: 2, borderColor: accent, radius: 12, fontSize: 16 }),
      el('image', 660, 130, 460, 420, { src: photo('builder-hero', 920, 840), alt: 'Ảnh minh hoạ' }, { radius: 28, shadow: 'lg' }),

      el('box', 0, 640, 1200, 400, {}, { background: '#f5f3ff', radius: 0 }),
      el('heading', 0, 685, 1200, 50, { text: 'Vì sao chọn chúng tôi?' }, { fontSize: 36, fontWeight: 700, textAlign: 'center' }),
      ...card(80, 'Kéo thả dễ dàng', 'Đặt ảnh, chữ, nút bấm vào bất kỳ đâu trên trang chỉ bằng chuột.'),
      ...card(440, 'Tuỳ biến tự do', 'Đổi màu sắc, phông chữ, bo góc, đổ bóng cho từng thành phần.'),
      ...card(800, 'Xem trước tức thì', 'Xem trang ở chế độ toàn màn hình trước khi xuất bản.'),

      el('divider', 80, 1080, 1040, 20, {}, { color: '#e5e7eb', lineWidth: 1 }),
      el('text', 0, 1116, 1200, 30, { text: '© 2026 Studio Mây · Được tạo bằng trình kéo thả' }, { fontSize: 14, color: '#9ca3af', textAlign: 'center' }),
    ],
  }
}

function profile() {
  const serif = { fontFamily: 'playfair' }
  const project = (x, seed, title) => [
    el('image', x, 760, 320, 220, { src: photo(seed, 640, 440), alt: title }, { radius: 14 }),
    el('text', x, 996, 320, 30, { text: title }, { fontSize: 17, fontWeight: 600, color: '#1f2937' }),
  ]
  return {
    page: { title: 'Hồ sơ cá nhân', width: 1200, height: 1120, background: '#fbf8f3' },
    elements: [
      el('image', 500, 80, 200, 200, { src: photo('builder-avatar', 400, 400), alt: 'Ảnh đại diện' }, { radius: 100, borderWidth: 6, borderColor: '#ffffff', shadow: 'md' }),
      el('heading', 200, 310, 800, 64, { text: 'Nguyễn Minh An' }, { ...serif, fontSize: 50, textAlign: 'center', color: '#1c1917' }),
      el('text', 250, 384, 700, 30, { text: 'Nhà thiết kế sản phẩm · Hà Nội' }, { fontSize: 18, textAlign: 'center', color: '#78716c' }),
      el('text', 250, 432, 700, 84, { text: 'Tôi thiết kế những sản phẩm số đơn giản, dễ dùng và có chút cá tính. Hơn 6 năm làm việc cùng các startup và agency.' }, { fontSize: 16, textAlign: 'center', color: '#57534e', lineHeight: 1.7 }),
      el('button', 430, 540, 160, 50, { text: 'Liên hệ', href: 'mailto:hello@example.com' }, { background: '#1c1917', radius: 999 }),
      el('button', 610, 540, 160, 50, { text: 'Tải CV' }, { background: 'transparent', color: '#1c1917', borderWidth: 1.5, borderColor: '#1c1917', radius: 999 }),
      el('divider', 300, 634, 600, 20, {}, { color: '#d6d3d1', lineWidth: 1, lineStyle: 'dashed' }),
      el('heading', 0, 682, 1200, 44, { text: 'Dự án nổi bật' }, { ...serif, fontSize: 32, textAlign: 'center', color: '#1c1917' }),
      ...project(100, 'builder-p1', 'Ứng dụng đặt lịch spa'),
      ...project(440, 'builder-p2', 'Nhận diện thương hiệu Cà phê Gió'),
      ...project(780, 'builder-p3', 'Website du lịch Hội An'),
    ],
  }
}

function blank() {
  return { page: { title: 'Trang web của tôi', width: 1200, height: 1000, background: '#ffffff' }, elements: [] }
}

export const TEMPLATES = [
  { id: 'landing', name: 'Landing page', description: 'Giới thiệu sản phẩm, dịch vụ', thumb: 'linear-gradient(135deg,#6366f1,#a78bfa)', create: landing },
  { id: 'profile', name: 'Hồ sơ cá nhân', description: 'Portfolio, CV trực tuyến', thumb: 'linear-gradient(135deg,#d6c7ae,#fbf8f3)', create: profile },
  { id: 'blank', name: 'Trang trống', description: 'Bắt đầu từ đầu', thumb: 'repeating-linear-gradient(45deg,#f3f4f6 0 6px,#fff 6px 12px)', create: blank },
]
