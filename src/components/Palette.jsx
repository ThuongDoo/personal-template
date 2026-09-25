import Icon from './Icon.jsx'
import { DND_TYPE, ELEMENT_TYPES, PALETTE_ORDER } from '../lib/elements.js'
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
    </div>
  )
}
