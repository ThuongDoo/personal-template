import Icon from './Icon.jsx'
import { DND_TYPE, ELEMENT_TYPES, PALETTE_ORDER } from '../lib/elements.js'
import { AUDIO_ORDER, AUDIO_PRESETS } from '../lib/audioViz.js'
import { SHAPES, SHAPE_ORDER, shapePaths } from '../lib/shapes.js'

// Small, fixed tear so the torn-paper tile icon reads at 20px.
const ICON_PROPS = { edge: 'diagonal', depth: 1.2, tooth: 2.5, rim: 0, seed: 7 }

function ShapeIcon({ shape }) {
  return (
    <svg width={20} height={20} viewBox="-2 -2 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d={shapePaths(shape, 20, 20, ICON_PROPS).fill} />
    </svg>
  )
}

// Frozen levels for the 20px audio tile icons.
const ICON_LEVELS = [0.45, 0.8, 0.55, 1, 0.65, 0.35, 0.75]

/** A still, simplified picture of each audio effect. */
function AudioIcon({ viz }) {
  const n = ICON_LEVELS.length
  let body
  if (viz === 'circle') {
    body = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2
      const r2 = 5 + (i % 3 === 0 ? 5 : i % 2 ? 3 : 4)
      return <line key={i} x1={10 + Math.cos(a) * 4} y1={10 + Math.sin(a) * 4} x2={10 + Math.cos(a) * r2} y2={10 + Math.sin(a) * r2} />
    })
  } else if (viz === 'pulse') {
    body = (
      <>
        <circle cx="10" cy="10" r="3.5" fill="currentColor" />
        <path d="M10 2.5c3 0 4.2 2.3 5.8 3.3 1.8 1.2 2.2 3.5 1 5.6-1 1.9-.6 4.6-3.3 5.4-2 .6-2.8-.6-4.4.3-1.8 1-3.7.7-4.9-.9-1.1-1.5-3.4-2.4-2.9-4.9.4-2 .1-3 1.4-4.9C4.1 4.2 6.8 2.5 10 2.5z" />
      </>
    )
  } else if (viz === 'wave') {
    body = <path d="M1 10c2-5 3 5 5 0s3-7 5 0 3 5 4 0 2-3 4 0M1 10c2 5 3-5 5 0s3 7 5 0 3-5 4 0 2 3 4 0" />
  } else if (viz === 'dots') {
    body = ICON_LEVELS.slice(0, 5).map((l, i) => <circle key={i} cx={2 + i * 4} cy="10" r={0.6 + l * 1.4} fill="currentColor" />)
  } else if (viz === 'blocks') {
    body = ICON_LEVELS.slice(0, 5).map((l, i) =>
      Array.from({ length: Math.round(l * 5) }, (_, j) => (
        <rect key={`${i}-${j}`} x={1.5 + i * 3.6} y={16.5 - j * 3.4} width="2.6" height="2.4" fill="currentColor" stroke="none" />
      )),
    )
  } else {
    body = ICON_LEVELS.map((l, i) => {
      const h = 3 + l * 13
      const x = 2 + i * (16 / (n - 1))
      return viz === 'mirror' ? <line key={i} x1={x} y1={10 - h / 2} x2={x} y2={10 + h / 2} /> : <line key={i} x1={x} y1={18} x2={x} y2={18 - h} />
    })
  }
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {body}
    </svg>
  )
}

function Tile({ dragKey, onAdd, children }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="tile"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_TYPE, dragKey)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={() => onAdd(dragKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onAdd(dragKey)
        }
      }}
    >
      {children}
    </div>
  )
}

export default function Palette({ onAdd }) {
  return (
    <div className="palette">
      <section className="section">
        <h4>Thành phần</h4>
        <p className="hint">Kéo vào trang, hoặc nhấp để thêm.</p>
        <div className="tiles">
          {PALETTE_ORDER.map((type) => (
            <Tile key={type} dragKey={type} onAdd={onAdd}>
              <Icon name={type} size={20} />
              <span>{ELEMENT_TYPES[type].label}</span>
            </Tile>
          ))}
        </div>
        <p className="hint">Mẹo: kéo thả tệp ảnh từ máy tính vào trang để chèn ảnh.</p>
      </section>

      <section className="section">
        <h4>Hình khối</h4>
        <p className="hint">Chèn ảnh vào hình: thả tệp ảnh lên hình, hoặc chọn ảnh ở bảng bên phải.</p>
        <div className="tiles tiles-3">
          {SHAPE_ORDER.map((shape) => (
            <Tile key={shape} dragKey={`shape:${shape}`} onAdd={onAdd}>
              <ShapeIcon shape={shape} />
              <span>{SHAPES[shape].label}</span>
            </Tile>
          ))}
        </div>
      </section>

      <section className="section">
        <h4>Âm thanh</h4>
        <p className="hint">Hiệu ứng nhảy theo nhạc khi phát. Tải tệp âm thanh ở bảng bên phải.</p>
        <div className="tiles tiles-3">
          {AUDIO_ORDER.map((viz) => (
            <Tile key={viz} dragKey={`audio:${viz}`} onAdd={onAdd}>
              <AudioIcon viz={viz} />
              <span>{AUDIO_PRESETS[viz].label}</span>
            </Tile>
          ))}
        </div>
      </section>
    </div>
  )
}
