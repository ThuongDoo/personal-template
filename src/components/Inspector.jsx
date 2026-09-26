import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { ColorInput, Field, NumberInput, Section, Segmented, Select } from './fields.jsx'
import { FONTS, TEXT_TYPES, elementLabel, youtubeEmbed } from '../lib/elements.js'
import { isUploadedImage, uploadIcon, uploadImage } from '../lib/cloud.js'
import { loadImageSize } from '../lib/image.js'
import { useMissingImage } from '../lib/useMissingImage.js'
import { SHAPES, SHAPE_ORDER, TORN_EDGES, randomSeed, shapeImageProps, zoomImageAt, IMG_ZOOM_MIN, IMG_ZOOM_MAX } from '../lib/shapes.js'

const WEIGHTS = [
  [300, 'Mảnh'],
  [400, 'Thường'],
  [500, 'Vừa'],
  [600, 'Đậm vừa'],
  [700, 'Đậm'],
  [800, 'Rất đậm'],
]
const SHADOWS = [
  ['none', 'Không'],
  ['sm', 'Nhẹ'],
  ['md', 'Vừa'],
  ['lg', 'Đậm'],
]
const LINE_STYLES = [
  ['solid', 'Liền'],
  ['dashed', 'Nét đứt'],
  ['dotted', 'Chấm'],
]
const ALIGN = [
  { value: 'left', icon: 'alignLeft', title: 'Căn trái' },
  { value: 'center', icon: 'alignCenter', title: 'Căn giữa' },
  { value: 'right', icon: 'alignRight', title: 'Căn phải' },
  { value: 'justify', icon: 'alignJustify', title: 'Căn đều' },
]
const VALIGN = [
  { value: 'top', icon: 'vTop', title: 'Trên' },
  { value: 'middle', icon: 'vMiddle', title: 'Giữa' },
  { value: 'bottom', icon: 'vBottom', title: 'Dưới' },
]
const FITS = [
  { value: 'cover', label: 'Lấp đầy', title: 'Cắt ảnh cho vừa khung' },
  { value: 'contain', label: 'Vừa khung', title: 'Hiện toàn bộ ảnh' },
  { value: 'fill', label: 'Kéo giãn', title: 'Kéo giãn theo khung' },
]

function ImageSection({ el, setProps, setGeom }) {
  const fileRef = useRef(null)
  const latestSrc = useRef(el.props.src)
  const [busy, setBusy] = useState(false)
  const { src, alt, fit } = el.props
  const uploaded = isUploadedImage(src)
  const isShape = el.type === 'shape'
  const missing = useMissingImage(src)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const img = await uploadImage(file)
      latestSrc.current = img.src
      const props = isShape ? shapeImageProps(img, file.name) : { src: img.src, alt: file.name.replace(/\.[^.]+$/, '') }
      setProps({ ...props, alt: alt || props.alt })
    } catch (err) {
      console.error(err)
      alert('Không tải được ảnh này lên.')
    } finally {
      setBusy(false)
    }
  }

  const onUrl = (url) => {
    latestSrc.current = url
    if (!isShape) return setProps({ src: url }, 'src')
    // Shapes position the image from its natural size, measured once the URL loads.
    setProps({ src: url, imgW: 0, imgH: 0, imgX: 50, imgY: 50, imgZoom: 1 }, 'src')
    if (!url) return
    loadImageSize(url)
      .then(({ width, height }) => {
        if (latestSrc.current === url) setProps({ imgW: width, imgH: height }, 'src')
      })
      .catch(() => {})
  }

  const matchRatio = async () => {
    try {
      const { width, height } = await loadImageSize(src)
      setGeom({ h: Math.round((el.w * height) / width) })
    } catch {
      alert('Không tải được ảnh để đo tỉ lệ.')
    }
  }

  return (
    <Section title="Hình ảnh">
      <div className="img-preview">
        {!src ? <span>Chưa có ảnh</span> : missing ? <span className="warn">Ảnh không còn tồn tại</span> : <img src={src} alt="" />}
      </div>
      {missing && <p className="warn">Ảnh này đã bị xoá khỏi kho lưu trữ. Hãy tải ảnh khác lên.</p>}
      <div className="row">
        <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Icon name="upload" size={14} />
          {busy ? 'Đang tải lên…' : src ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </button>
        {isShape ? (
          <button type="button" className="btn" onClick={() => onUrl('')} disabled={!src} title="Bỏ ảnh, dùng màu nền">
            Bỏ ảnh
          </button>
        ) : (
          <button type="button" className="btn" onClick={matchRatio} disabled={!src} title="Đặt chiều cao theo tỉ lệ ảnh gốc">
            Khớp tỉ lệ
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      <Field label="Hoặc dán đường dẫn ảnh">
        <input
          className="input"
          value={uploaded ? '' : src}
          placeholder={uploaded ? '(đang dùng ảnh tải lên)' : 'https://...'}
          onChange={(e) => onUrl(e.target.value.trim())}
        />
      </Field>
      {!isShape && (
        <Field label="Cách hiển thị">
          <Segmented value={fit} options={FITS} onChange={(v) => setProps({ fit: v })} />
        </Field>
      )}
      <Field label="Mô tả ảnh (alt)">
        <input className="input" value={alt} onChange={(e) => setProps({ alt: e.target.value }, 'alt')} />
      </Field>
    </Section>
  )
}

function ImagePositionSection({ el, editing, setProps, onAction }) {
  const p = el.props
  const [measuring, setMeasuring] = useState(false)
  if (!p.src) return null

  // Images added before positioning existed have no stored size yet.
  if (!p.imgW) {
    const measure = async () => {
      setMeasuring(true)
      try {
        const { width, height } = await loadImageSize(p.src)
        setProps({ imgW: width, imgH: height })
      } catch {
        alert('Không tải được ảnh.')
      } finally {
        setMeasuring(false)
      }
    }
    return (
      <Section title="Vị trí ảnh trong hình">
        <button type="button" className="btn block" onClick={measure} disabled={measuring}>
          {measuring ? 'Đang tải ảnh…' : 'Bật căn chỉnh vị trí ảnh'}
        </button>
      </Section>
    )
  }

  return (
    <Section title="Vị trí ảnh trong hình">
      <button type="button" className={`btn block${editing ? ' primary' : ''}`} onClick={() => onAction('crop')} disabled={el.locked}>
        <Icon name="move" size={14} />
        {editing ? 'Xong' : 'Kéo ảnh trực tiếp trên trang'}
      </button>
      <p className="hint">Hoặc nhấp đúp vào hình: kéo để dời ảnh, cuộn chuột để phóng to/thu nhỏ, Esc để xong.</p>
      <Field label="Ngang">
        <RangeInput value={p.imgX} min={0} max={100} format={(v) => `${Math.round(v)}%`} onChange={(v) => setProps({ imgX: v }, 'imgX')} />
      </Field>
      <Field label="Dọc">
        <RangeInput value={p.imgY} min={0} max={100} format={(v) => `${Math.round(v)}%`} onChange={(v) => setProps({ imgY: v }, 'imgY')} />
      </Field>
      <Field label="Thu phóng">
        <RangeInput
          value={p.imgZoom}
          min={IMG_ZOOM_MIN}
          max={IMG_ZOOM_MAX}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => setProps(zoomImageAt(el.w, el.h, p, v), 'imgZoom')}
        />
      </Field>
      <button type="button" className="btn block" onClick={() => setProps({ imgX: 50, imgY: 50, imgZoom: 1 })}>
        Đặt lại vị trí ảnh
      </button>
    </Section>
  )
}

function ShapeSection({ el, setProps }) {
  const p = el.props
  const torn = p.shape === 'torn'
  return (
    <Section title="Hình dạng">
      <Field label="Dạng hình">
        <Select value={p.shape} options={SHAPE_ORDER.map((s) => [s, SHAPES[s].label])} onChange={(v) => setProps({ shape: v })} />
      </Field>
      {torn && (
        <>
          <Field label="Vị trí mép rách">
            <Select value={p.edge} options={TORN_EDGES} onChange={(v) => setProps({ edge: v })} />
          </Field>
          <div className="grid2">
            <Field label="Độ sâu vết rách">
              <NumberInput value={p.depth} min={0} max={80} suffix="px" onChange={(v) => setProps({ depth: v }, 'depth')} />
            </Field>
            <Field label="Cỡ răng cưa">
              <NumberInput value={p.tooth} min={2} max={80} suffix="px" onChange={(v) => setProps({ tooth: v }, 'tooth')} />
            </Field>
          </div>
        </>
      )}
      {(torn || p.shape === 'blob') && (
        <button type="button" className="btn block" onClick={() => setProps({ seed: randomSeed() })}>
          {torn ? 'Xé lại (tạo vết rách khác)' : 'Tạo hình cong khác'}
        </button>
      )}
      <div className="grid2">
        <Field label={torn ? 'Viền giấy' : 'Viền'}>
          <NumberInput value={p.rim} min={0} max={40} suffix="px" onChange={(v) => setProps({ rim: v }, 'rim')} />
        </Field>
        {p.rim > 0 && (
          <Field label="Màu viền">
            <ColorInput value={p.rimColor} onChange={(v) => setProps({ rimColor: v }, 'rimColor')} />
          </Field>
        )}
      </div>
      <label className="check">
        <input type="checkbox" checked={p.texture} onChange={(e) => setProps({ texture: e.target.checked })} />
        Vân giấy
      </label>
      <label className="check">
        <input type="checkbox" checked={p.shadow} onChange={(e) => setProps({ shadow: e.target.checked })} />
        Đổ bóng
      </label>
    </Section>
  )
}

function ContentSection({ el, editing, setProps, setGeom, onAction }) {
  const p = el.props
  if (el.type === 'image') return <ImageSection key={el.id} el={el} setProps={setProps} setGeom={setGeom} />
  if (el.type === 'shape') {
    return (
      <>
        <ImageSection key={el.id} el={el} setProps={setProps} setGeom={setGeom} />
        <ImagePositionSection el={el} editing={editing} setProps={setProps} onAction={onAction} />
        <ShapeSection el={el} setProps={setProps} />
      </>
    )
  }

  if (el.type === 'video') {
    const valid = !p.url || youtubeEmbed(p.url)
    return (
      <Section title="Video">
        <Field label="Đường dẫn YouTube">
          <input
            className="input"
            value={p.url}
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(e) => setProps({ url: e.target.value.trim() }, 'url')}
          />
        </Field>
        {!valid && <p className="warn">Đường dẫn chưa đúng định dạng YouTube.</p>}
        <p className="hint">Video chỉ phát được ở chế độ xem trước.</p>
      </Section>
    )
  }

  if (!TEXT_TYPES.includes(el.type)) return null

  return (
    <Section title="Nội dung">
      <Field label="Văn bản">
        <textarea
          className="input"
          rows={el.type === 'text' ? 4 : 2}
          value={p.text}
          onChange={(e) => setProps({ text: e.target.value }, 'text')}
        />
      </Field>
      <p className="hint">Hoặc nhấp đúp vào phần tử trên trang để sửa trực tiếp.</p>
      {el.type === 'button' && (
        <>
          <Field label="Liên kết khi nhấn">
            <input
              className="input"
              value={p.href}
              placeholder="https://... hoặc mailto:..."
              onChange={(e) => setProps({ href: e.target.value }, 'href')}
            />
          </Field>
          <label className="check">
            <input type="checkbox" checked={p.newTab} onChange={(e) => setProps({ newTab: e.target.checked })} />
            Mở trong tab mới
          </label>
        </>
      )}
    </Section>
  )
}

function TypographySection({ s, setStyle }) {
  return (
    <Section title="Chữ">
      <Field label="Phông chữ">
        <Select value={s.fontFamily} options={FONTS.map((f) => [f.value, f.label])} onChange={(v) => setStyle({ fontFamily: v })} />
      </Field>
      <div className="grid2">
        <Field label="Cỡ chữ">
          <NumberInput value={s.fontSize} min={6} max={400} suffix="px" onChange={(v) => setStyle({ fontSize: v }, 'fontSize')} />
        </Field>
        <Field label="Độ đậm">
          <Select value={s.fontWeight} options={WEIGHTS} onChange={(v) => setStyle({ fontWeight: Number(v) })} />
        </Field>
        <Field label="Giãn dòng">
          <NumberInput value={s.lineHeight} min={0.5} max={4} step={0.1} onChange={(v) => setStyle({ lineHeight: v }, 'lineHeight')} />
        </Field>
        <Field label="Giãn chữ">
          <NumberInput value={s.letterSpacing} min={-10} max={40} step={0.5} suffix="px" onChange={(v) => setStyle({ letterSpacing: v }, 'letterSpacing')} />
        </Field>
      </div>
      <Field label="Màu chữ">
        <ColorInput value={s.color} onChange={(v) => setStyle({ color: v }, 'color')} />
      </Field>
      <div className="grid2">
        <Field label="Căn ngang">
          <Segmented value={s.textAlign} options={ALIGN} onChange={(v) => setStyle({ textAlign: v })} />
        </Field>
        <Field label="Căn dọc">
          <Segmented value={s.verticalAlign} options={VALIGN} onChange={(v) => setStyle({ verticalAlign: v })} />
        </Field>
      </div>
      <div className="row">
        <button type="button" className={`icon-btn${s.italic ? ' on' : ''}`} title="In nghiêng" onClick={() => setStyle({ italic: !s.italic })}>
          <Icon name="italic" />
        </button>
        <button type="button" className={`icon-btn${s.underline ? ' on' : ''}`} title="Gạch chân" onClick={() => setStyle({ underline: !s.underline })}>
          <Icon name="underline" />
        </button>
      </div>
    </Section>
  )
}

function AppearanceSection({ el, s, setStyle }) {
  if (el.type === 'shape') {
    return (
      <Section title="Màu nền">
        <Field label="Màu nền (khi không có ảnh)">
          <ColorInput value={s.background} allowNone onChange={(v) => setStyle({ background: v }, 'background')} />
        </Field>
        <Field label="Độ mờ">
          <OpacitySlider value={s.opacity} onChange={(v) => setStyle({ opacity: v }, 'opacity')} />
        </Field>
      </Section>
    )
  }

  if (el.type === 'divider') {
    return (
      <Section title="Đường kẻ">
        <Field label="Màu">
          <ColorInput value={s.color} onChange={(v) => setStyle({ color: v }, 'color')} />
        </Field>
        <div className="grid2">
          <Field label="Độ dày">
            <NumberInput value={s.lineWidth} min={1} max={40} suffix="px" onChange={(v) => setStyle({ lineWidth: v }, 'lineWidth')} />
          </Field>
          <Field label="Kiểu">
            <Select value={s.lineStyle} options={LINE_STYLES} onChange={(v) => setStyle({ lineStyle: v })} />
          </Field>
        </div>
        <Field label="Độ mờ">
          <OpacitySlider value={s.opacity} onChange={(v) => setStyle({ opacity: v }, 'opacity')} />
        </Field>
      </Section>
    )
  }

  return (
    <Section title="Nền & viền">
      <Field label="Màu nền">
        <ColorInput value={s.background} allowNone onChange={(v) => setStyle({ background: v }, 'background')} />
      </Field>
      <div className="grid2">
        <Field label="Bo góc">
          <NumberInput value={s.radius} min={0} max={999} suffix="px" onChange={(v) => setStyle({ radius: v }, 'radius')} />
        </Field>
        <Field label="Khoảng đệm">
          <NumberInput value={s.padding} min={0} max={200} suffix="px" onChange={(v) => setStyle({ padding: v }, 'padding')} />
        </Field>
        <Field label="Độ dày viền">
          <NumberInput value={s.borderWidth} min={0} max={40} step={0.5} suffix="px" onChange={(v) => setStyle({ borderWidth: v }, 'borderWidth')} />
        </Field>
        <Field label="Kiểu viền">
          <Select value={s.borderStyle} options={LINE_STYLES} onChange={(v) => setStyle({ borderStyle: v })} />
        </Field>
      </div>
      {s.borderWidth > 0 && (
        <Field label="Màu viền">
          <ColorInput value={s.borderColor} onChange={(v) => setStyle({ borderColor: v }, 'borderColor')} />
        </Field>
      )}
      <Field label="Đổ bóng">
        <Select value={s.shadow} options={SHADOWS} onChange={(v) => setStyle({ shadow: v })} />
      </Field>
      <Field label="Độ mờ">
        <OpacitySlider value={s.opacity} onChange={(v) => setStyle({ opacity: v }, 'opacity')} />
      </Field>
    </Section>
  )
}

function RangeInput({ value, min, max, step = 1, format, onChange }) {
  return (
    <div className="slider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span>{format(value)}</span>
    </div>
  )
}

function OpacitySlider({ value, onChange }) {
  return (
    <div className="slider">
      <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={(e) => onChange(Number(e.target.value) / 100)} />
      <span>{Math.round(value * 100)}%</span>
    </div>
  )
}

function SiteSection({ page, onChange }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const faviconMissing = useMissingImage(page.favicon)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      onChange({ favicon: await uploadIcon(file) })
    } catch (err) {
      console.error(err)
      alert('Không tải được icon lên.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Website">
      <Field label="Tiêu đề web (hiện trên tab trình duyệt)">
        <input
          className="input"
          value={page.title}
          maxLength={70}
          placeholder="VD: Tiệm bánh Mây"
          onChange={(e) => onChange({ title: e.target.value }, 'title')}
        />
      </Field>
      <div className="field">
        <span className="field-label">Icon web (favicon)</span>
        <div className="favicon-row">
          <span className="favicon-preview">
            {page.favicon && !faviconMissing ? <img src={page.favicon} alt="" /> : <Icon name="image" size={16} />}
          </span>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Icon name="upload" size={14} />
            {busy ? 'Đang tải lên…' : page.favicon ? 'Đổi icon' : 'Tải icon lên'}
          </button>
          {page.favicon && (
            <button type="button" className="btn" onClick={() => onChange({ favicon: '' })} disabled={busy}>
              Bỏ
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon" hidden onChange={onFile} />
        {faviconMissing && <p className="warn">Icon đã bị xoá khỏi kho lưu trữ. Hãy tải icon khác lên.</p>}
        <p className="hint">Nên dùng ảnh vuông, tối thiểu 64×64px.</p>
      </div>
    </Section>
  )
}

function PageSettings({ page, onChange }) {
  return (
    <div className="inspector">
      <div className="insp-head">
        <div>
          <strong>Cài đặt trang</strong>
          <small>Chọn một phần tử để chỉnh sửa nó</small>
        </div>
      </div>
      <SiteSection page={page} onChange={onChange} />
      <Section title="Trang">
        <Field label="Chiều rộng thiết kế">
          <Segmented
            value={page.width}
            options={[960, 1200, 1440].map((w) => ({ value: w, label: String(w) }))}
            onChange={(v) => onChange({ width: v })}
          />
        </Field>
        <div className="grid2">
          <Field label="Rộng">
            <NumberInput value={page.width} min={320} max={3000} suffix="px" onChange={(v) => onChange({ width: v }, 'width')} />
          </Field>
          <Field label="Cao">
            <NumberInput value={page.height} min={300} max={20000} suffix="px" onChange={(v) => onChange({ height: v }, 'height')} />
          </Field>
        </div>
        <Field label="Màu nền trang">
          <ColorInput value={page.background} onChange={(v) => onChange({ background: v }, 'background')} />
        </Field>
      </Section>
      <Section title="Phím tắt">
        <dl className="shortcuts">
          <dt>Nhấp đúp</dt>
          <dd>Sửa chữ trực tiếp</dd>
          <dt>Mũi tên</dt>
          <dd>Dịch 1px (Shift: 10px)</dd>
          <dt>Shift + kéo góc</dt>
          <dd>Giữ tỉ lệ khi đổi cỡ</dd>
          <dt>Alt + kéo</dt>
          <dd>Tắt hít nam châm</dd>
          <dt>Ctrl + S</dt>
          <dd>Lưu lên đám mây</dd>
          <dt>Ctrl + Z / Y</dt>
          <dd>Hoàn tác / Làm lại</dd>
          <dt>Ctrl + C / V / D</dt>
          <dd>Sao chép / Dán / Nhân bản</dd>
          <dt>Delete</dt>
          <dd>Xoá phần tử</dd>
          <dt>Esc</dt>
          <dd>Bỏ chọn / thoát xem trước</dd>
        </dl>
      </Section>
    </div>
  )
}

export default function Inspector({ el, editing, page, onChange, onPageChange, onAction }) {
  if (!el) return <PageSettings page={page} onChange={onPageChange} />

  const s = el.style
  const setProps = (patch, key) => onChange(el.id, { props: patch }, key && `props.${key}`)
  const setStyle = (patch, key) => onChange(el.id, { style: patch }, key && `style.${key}`)
  const setGeom = (patch, key) => onChange(el.id, patch, key)

  return (
    <div className="inspector">
      <div className="insp-head">
        <div>
          <strong>{elementLabel(el)}</strong>
          <small>{el.locked ? 'Đã khoá vị trí' : 'Kéo để di chuyển, kéo góc để đổi cỡ'}</small>
        </div>
      </div>
      <div className="insp-actions">
        <button type="button" className="icon-btn" title="Lên trên cùng" onClick={() => onAction('front')}>
          <Icon name="top" />
        </button>
        <button type="button" className="icon-btn" title="Lên một lớp" onClick={() => onAction('up')}>
          <Icon name="front" />
        </button>
        <button type="button" className="icon-btn" title="Xuống một lớp" onClick={() => onAction('down')}>
          <Icon name="back" />
        </button>
        <button type="button" className="icon-btn" title="Xuống dưới cùng" onClick={() => onAction('back')}>
          <Icon name="bottom" />
        </button>
        <span className="sep" />
        <button type="button" className={`icon-btn${el.locked ? ' on' : ''}`} title={el.locked ? 'Mở khoá' : 'Khoá vị trí'} onClick={() => onAction('lock')}>
          <Icon name={el.locked ? 'lock' : 'unlock'} />
        </button>
        <button type="button" className="icon-btn" title="Nhân bản (Ctrl+D)" onClick={() => onAction('duplicate')}>
          <Icon name="copy" />
        </button>
        <button type="button" className="icon-btn danger" title="Xoá (Delete)" onClick={() => onAction('delete')}>
          <Icon name="trash" />
        </button>
      </div>

      <ContentSection el={el} editing={editing} setProps={setProps} setGeom={setGeom} onAction={onAction} />

      <Section title="Vị trí & kích thước">
        <div className="grid2">
          <Field label="X">
            <NumberInput value={el.x} onChange={(v) => setGeom({ x: Math.round(v) }, 'x')} />
          </Field>
          <Field label="Y">
            <NumberInput value={el.y} onChange={(v) => setGeom({ y: Math.round(v) }, 'y')} />
          </Field>
          <Field label="Rộng">
            <NumberInput value={el.w} min={16} onChange={(v) => setGeom({ w: Math.round(v) }, 'w')} />
          </Field>
          <Field label="Cao">
            <NumberInput value={el.h} min={16} onChange={(v) => setGeom({ h: Math.round(v) }, 'h')} />
          </Field>
        </div>
        <button type="button" className="btn block" onClick={() => setGeom({ x: Math.round((page.width - el.w) / 2) })}>
          <Icon name="centerH" size={14} />
          Căn giữa theo chiều ngang trang
        </button>
      </Section>

      {TEXT_TYPES.includes(el.type) && <TypographySection s={s} setStyle={setStyle} />}
      <AppearanceSection el={el} s={s} setStyle={setStyle} />
    </div>
  )
}
