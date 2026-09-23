import Icon from './Icon.jsx'
import { DND_TYPE, ELEMENT_TYPES, PALETTE_ORDER } from '../lib/elements.js'
import { TEMPLATES } from '../lib/templates.js'

export default function Palette({ onAdd, onTemplate }) {
  return (
    <div className="palette">
      <section className="section">
        <h4>Thành phần</h4>
        <p className="hint">Kéo vào trang, hoặc nhấp để thêm.</p>
        <div className="tiles">
          {PALETTE_ORDER.map((type) => (
            <div
              key={type}
              role="button"
              tabIndex={0}
              className="tile"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(DND_TYPE, type)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onClick={() => onAdd(type)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onAdd(type)
                }
              }}
            >
              <Icon name={type} size={20} />
              <span>{ELEMENT_TYPES[type].label}</span>
            </div>
          ))}
        </div>
        <p className="hint">Mẹo: kéo thả tệp ảnh từ máy tính vào trang để chèn ảnh.</p>
      </section>

      <section className="section">
        <h4>Mẫu trang</h4>
        <div className="templates">
          {TEMPLATES.map((t) => (
            <button key={t.id} type="button" className="template" onClick={() => onTemplate(t)}>
              <span className="template-thumb" style={{ background: t.thumb }} />
              <span className="template-text">
                <strong>{t.name}</strong>
                <small>{t.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
