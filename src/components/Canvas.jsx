import { useState } from 'react'
import ElementContent from './ElementContent.jsx'
import { DND_TYPE, GRID, TEXT_TYPES } from '../lib/elements.js'

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const MIN_SIZE = 16
const SNAP_PX = 6
const AUTOSCROLL_EDGE = 60
const AUTOSCROLL_MAX = 10 // px per frame (~600px/s)
const AUTOSCROLL_ACCEL = 0.12
const toGrid = (v) => Math.round(v / GRID) * GRID

/** Closest target line to any of the given edges, within threshold. */
function findSnap(edges, targets, threshold) {
  let best = null
  for (const t of targets) {
    for (const e of edges) {
      const d = t - e
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, line: t }
    }
  }
  return best
}

function blurActive() {
  const a = document.activeElement
  if (a && a !== document.body) a.blur()
}

export default function Canvas({
  doc,
  zoom,
  selectedId,
  editingId,
  showGrid,
  snap,
  workspaceRef,
  canvasRef,
  set,
  checkpoint,
  onSelect,
  onEdit,
  onCommitText,
  onDropElement,
  onDropFiles,
}) {
  const [guides, setGuides] = useState([])
  const [dropActive, setDropActive] = useState(false)
  const { page, elements } = doc
  const selected = elements.find((el) => el.id === selectedId && !el.hidden)

  const setGeom = (id, geom) =>
    set((d) => ({ ...d, elements: d.elements.map((el) => (el.id === id ? { ...el, ...geom } : el)) }), {
      transient: true,
    })

  // Tracks a pointer gesture in canvas units. History is checkpointed once the pointer actually moves,
  // so a plain click doesn't create an undo step.
  const track = (e, onMove, onEnd) => {
    const sx = e.clientX
    const sy = e.clientY
    let started = false
    const move = (ev) => {
      if (!started) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return
        started = true
        checkpoint()
      }
      onMove((ev.clientX - sx) / zoom, (ev.clientY - sy) / zoom, ev)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      onEnd?.()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const startMove = (e, el) => {
    if (e.button !== 0) return
    e.stopPropagation()
    if (editingId === el.id) return
    blurActive()
    onSelect(el.id)
    if (el.locked) return
    e.preventDefault()

    const others = elements.filter((o) => o.id !== el.id && !o.hidden)
    const tx = [0, page.width / 2, page.width, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])]
    const ty = [0, page.height / 2, page.height, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])]

    track(
      e,
      (dx, dy, ev) => {
        let x = el.x + dx
        let y = el.y + dy
        const g = []
        const free = ev.altKey
        const sx = snap && !free && findSnap([x, x + el.w / 2, x + el.w], tx, SNAP_PX / zoom)
        const sy = snap && !free && findSnap([y, y + el.h / 2, y + el.h], ty, SNAP_PX / zoom)
        if (sx) {
          x += sx.d
          g.push({ axis: 'x', pos: sx.line })
        } else if (showGrid && !free) x = toGrid(x)
        if (sy) {
          y += sy.d
          g.push({ axis: 'y', pos: sy.line })
        } else if (showGrid && !free) y = toGrid(y)
        setGuides(g)
        setGeom(el.id, { x: Math.round(x), y: Math.round(y) })
      },
      () => setGuides([]),
    )
  }

  const startResize = (e, el, handle) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const ratio = el.w / el.h
    const hasN = handle.includes('n')
    const hasS = handle.includes('s')
    const hasE = handle.includes('e')
    const hasW = handle.includes('w')

    track(e, (dx, dy, ev) => {
      const grid = showGrid && !ev.altKey
      let left = el.x
      let top = el.y
      let right = el.x + el.w
      let bottom = el.y + el.h
      if (hasE) right = grid ? toGrid(right + dx) : right + dx
      if (hasW) left = grid ? toGrid(left + dx) : left + dx
      if (hasS) bottom = grid ? toGrid(bottom + dy) : bottom + dy
      if (hasN) top = grid ? toGrid(top + dy) : top + dy
      if (right - left < MIN_SIZE) {
        if (hasW) left = right - MIN_SIZE
        else right = left + MIN_SIZE
      }
      if (bottom - top < MIN_SIZE) {
        if (hasN) top = bottom - MIN_SIZE
        else bottom = top + MIN_SIZE
      }

      let w = right - left
      let h = bottom - top
      if (ev.shiftKey && handle.length === 2) {
        if (w / h > ratio) h = w / ratio
        else w = h * ratio
        if (hasW) left = right - w
        if (hasN) top = bottom - h
      }
      setGeom(el.id, { x: Math.round(left), y: Math.round(top), w: Math.round(w), h: Math.round(h) })
    })
  }

  const startPageResize = (e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const ws = workspaceRef.current
    const h0 = page.height
    const sy = e.clientY
    const scroll0 = ws.scrollTop
    let pointerY = e.clientY
    let started = false
    let raf = 0

    // Runs every frame: holding the pointer near the workspace's top/bottom edge auto-scrolls it,
    // and the scrolled distance counts toward the drag, so the page can grow past the visible area.
    const tick = () => {
      const r = ws.getBoundingClientRect()
      const below = pointerY - (r.bottom - AUTOSCROLL_EDGE)
      const above = r.top + AUTOSCROLL_EDGE - pointerY
      if (below > 0) ws.scrollTop += Math.min(AUTOSCROLL_MAX, 1 + below * AUTOSCROLL_ACCEL)
      else if (above > 0) ws.scrollTop -= Math.min(AUTOSCROLL_MAX, 1 + above * AUTOSCROLL_ACCEL)

      const dy = pointerY - sy + ws.scrollTop - scroll0
      if (!started && Math.abs(dy) >= 3) {
        started = true
        checkpoint()
      }
      if (started) {
        const height = Math.max(300, toGrid(h0 + dy / zoom))
        set((d) => (d.page.height === height ? d : { ...d, page: { ...d.page, height } }), { transient: true })
      }
      raf = requestAnimationFrame(tick)
    }
    const move = (ev) => {
      pointerY = ev.clientY
    }
    const up = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    raf = requestAnimationFrame(tick)
  }

  const deselect = (e) => {
    if (e.target !== e.currentTarget) return
    blurActive()
    onSelect(null)
  }

  const acceptsDrag = (e) => e.dataTransfer.types.includes(DND_TYPE) || e.dataTransfer.types.includes('Files')

  const onDrop = (e) => {
    setDropActive(false)
    if (!acceptsDrag(e)) return
    e.preventDefault()
    const r = canvasRef.current.getBoundingClientRect()
    const pos = { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom }
    const type = e.dataTransfer.getData(DND_TYPE)
    if (type) onDropElement(type, pos)
    else if (e.dataTransfer.files.length) onDropFiles([...e.dataTransfer.files], pos)
  }

  return (
    <div className="workspace" ref={workspaceRef} onPointerDown={deselect}>
      <div
        className={`canvas-frame${dropActive ? ' drop-active' : ''}`}
        style={{ width: page.width * zoom, height: page.height * zoom, '--z': zoom }}
        onDragOver={(e) => {
          if (!acceptsDrag(e)) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          if (!dropActive) setDropActive(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDropActive(false)
        }}
        onDrop={onDrop}
      >
        <div
          ref={canvasRef}
          className={`canvas${showGrid ? ' show-grid' : ''}`}
          style={{ width: page.width, height: page.height, background: page.background, transform: `scale(${zoom})` }}
          onPointerDown={deselect}
        >
          {elements.map((el, i) =>
            el.hidden ? null : (
              <div
                key={el.id}
                className={`el${el.locked ? ' locked' : ''}${editingId === el.id ? ' editing' : ''}`}
                style={{ left: el.x, top: el.y, width: el.w, height: el.h, zIndex: i + 1 }}
                onPointerDown={(e) => startMove(e, el)}
                onDoubleClick={() => {
                  if (TEXT_TYPES.includes(el.type) && !el.locked) onEdit(el.id)
                }}
              >
                <ElementContent
                  el={el}
                  mode="editor"
                  editing={editingId === el.id}
                  onCommitText={(text) => onCommitText(el.id, text)}
                />
              </div>
            ),
          )}
          {elements.length === 0 && (
            <div className="canvas-empty">
              <strong>Trang đang trống</strong>
              <span>Kéo thành phần từ cột bên trái vào đây để bắt đầu</span>
            </div>
          )}
        </div>

        {/* Overlay sits outside the clipped canvas so handles stay visible at the page edges. */}
        <div className="canvas-overlay" style={{ width: page.width, height: page.height, transform: `scale(${zoom})` }}>
          {guides.map((g, i) => (
            <div
              key={i}
              className={`guide guide-${g.axis}`}
              style={g.axis === 'x' ? { left: g.pos } : { top: g.pos }}
            />
          ))}
          {selected && (
            <div
              className={`selection${selected.locked ? ' locked' : ''}`}
              style={{ left: selected.x, top: selected.y, width: selected.w, height: selected.h }}
            >
              {!selected.locked &&
                editingId !== selected.id &&
                HANDLES.map((h) => (
                  <span key={h} className={`handle handle-${h}`} onPointerDown={(e) => startResize(e, selected, h)} />
                ))}
              <span className="size-badge">
                {selected.locked ? 'Đã khoá · ' : ''}
                {selected.w} × {selected.h}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="page-height-handle"
          title="Kéo để thay đổi chiều cao trang"
          onPointerDown={startPageResize}
        >
          Chiều cao trang: {page.height}px · kéo để đổi
        </button>
      </div>
    </div>
  )
}
