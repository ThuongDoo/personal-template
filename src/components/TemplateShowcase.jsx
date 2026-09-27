import { useEffect, useEffectEvent, useRef, useState } from 'react'
import DesignThumb from './DesignThumb.jsx'
import Icon from './Icon.jsx'

/**
 * One template at a time, as large as the space allows: the whole page scaled to the frame's width and
 * scrollable inside it, with previous / next buttons (and the arrow keys) to go through the list.
 */
export default function TemplateShowcase({ templates, creating, canCreate, onUse }) {
  const [index, setIndex] = useState(0)
  const frameRef = useRef(null)
  const [width, setWidth] = useState(0)
  const count = templates.length
  const current = templates[Math.min(index, count - 1)]
  const ready = count > 0

  // The preview is drawn at the frame's inner width (without its scrollbar).
  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const ro = new ResizeObserver(() => setWidth(node.clientWidth))
    ro.observe(node)
    return () => ro.disconnect()
  }, [ready])

  const go = (step) => setIndex((i) => (i + step + count) % count)

  // A new template starts from its top.
  useEffect(() => {
    frameRef.current?.scrollTo({ top: 0 })
  }, [index])

  const onKey = useEffectEvent((e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
    if (e.key === 'ArrowLeft') go(-1)
    else if (e.key === 'ArrowRight') go(1)
  })
  useEffect(() => {
    const handler = (e) => onKey(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!count) return <div className="showcase showcase-empty">Đang tải mẫu trang…</div>

  return (
    <div className="showcase">
      <div className="showcase-head">
        <div className="showcase-title">
          <span className="showcase-count">
            Mẫu {index + 1} / {count}
          </span>
          <strong>{current.name}</strong>
          {current.description && <small>{current.description}</small>}
        </div>
        <button type="button" className="btn primary" onClick={() => onUse(current)} disabled={!canCreate}>
          <Icon name="plus" size={14} />
          {creating === current.id ? 'Đang tạo…' : 'Dùng mẫu này'}
        </button>
      </div>

      <div className="showcase-stage">
        <button type="button" className="showcase-nav" onClick={() => go(-1)} disabled={count < 2} aria-label="Mẫu trước (phím ←)" title="Mẫu trước (←)">
          <Icon name="chevronLeft" size={22} />
        </button>
        <div className="showcase-frame" ref={frameRef} tabIndex={0} aria-label={`Xem trước mẫu ${current.name}`}>
          {width > 0 && <DesignThumb key={current.id} design={current.preview} width={width} full />}
        </div>
        <button type="button" className="showcase-nav" onClick={() => go(1)} disabled={count < 2} aria-label="Mẫu tiếp theo (phím →)" title="Mẫu tiếp theo (→)">
          <Icon name="chevronRight" size={22} />
        </button>
      </div>

      <div className="showcase-dots" role="tablist" aria-label="Chọn mẫu">
        {templates.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`showcase-dot${i === index ? ' on' : ''}`}
            title={t.name}
            aria-label={t.name}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  )
}
