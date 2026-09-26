import { useEffect, useEffectEvent, useState } from 'react'
import ElementContent from './ElementContent.jsx'
import Icon from './Icon.jsx'
import { DND_TYPE, GRID, TEXT_TYPES, applyPatch, clamp } from '../lib/elements.js'
import { bounds, normalizeAngle, rotationTransform, toLocal, vectorToLocal, vectorToPage } from '../lib/geometry.js'
import { imageRect, zoomImageAt } from '../lib/shapes.js'

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const MIN_SIZE = 16
const SNAP_PX = 6
const AUTOSCROLL_EDGE = 60
const AUTOSCROLL_MAX = 10 // px per frame (~600px/s)
const AUTOSCROLL_ACCEL = 0.12
const toGrid = (v) => Math.round(v / GRID) * GRID
const ZOOM_STEP = 1.2
/** With snapping on, rotation clicks to multiples of 45° within this many degrees. */
const ROTATE_SNAP_DEG = 4

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

  const setPropsLive = (id, props) =>
    set((d) => ({ ...d, elements: d.elements.map((el) => (el.id === id ? applyPatch(el, { props }) : el)) }), {
      transient: true,
    })

  const cropping = elements.find((el) => el.id === editingId && el.type === 'shape')

  /** Zooms a shape's image, keeping the point (px, py) in element coordinates fixed. One undo step per burst. */
  const zoomImage = (el, zoomTo, px, py) =>
    set(
      (d) => ({
        ...d,
        elements: d.elements.map((e) =>
          e.id === el.id ? applyPatch(e, { props: zoomImageAt(e.w, e.h, e.props, zoomTo(e.props.imgZoom), px, py) }) : e,
        ),
      }),
      { merge: `${el.id}:imgZoom` },
    )

  // Mouse wheel over the shape being cropped zooms its image around the pointer. Registered natively
  // because React's wheel listener is passive and can't stop the page from scrolling.
  const onWheel = useEffectEvent((e) => {
    if (!cropping?.props.imgW) return
    const r = canvasRef.current.getBoundingClientRect()
    const { x: px, y: py } = toLocal(cropping, (e.clientX - r.left) / zoom, (e.clientY - r.top) / zoom)
    if (px < 0 || py < 0 || px > cropping.w || py > cropping.h) return
    e.preventDefault()
    const factor = Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0015))
    zoomImage(cropping, (z) => z * factor, px, py)
  })

  useEffect(() => {
    const node = canvasRef.current
    const handler = (e) => onWheel(e)
    node.addEventListener('wheel', handler, { passive: false })
    return () => node.removeEventListener('wheel', handler)
  }, [canvasRef])

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
    if (editingId === el.id && el.type !== 'shape') return
    blurActive()
    onSelect(el.id)
    if (el.locked) return
    if (el.type === 'shape' && editingId === el.id) return startPan(e, el)
    e.preventDefault()

    // Guides use what elements visually cover, so rotated ones snap by their outer edges.
    const others = elements.filter((o) => o.id !== el.id && !o.hidden).map(bounds)
    const tx = [0, page.width / 2, page.width, ...others.flatMap((b) => [b.left, b.cx, b.right])]
    const ty = [0, page.height / 2, page.height, ...others.flatMap((b) => [b.top, b.cy, b.bottom])]
    // The moving element's visual edges, as offsets from its x/y (constant while dragging).
    const own = bounds(el)
    const ex = [own.left - el.x, own.cx - el.x, own.right - el.x]
    const ey = [own.top - el.y, own.cy - el.y, own.bottom - el.y]

    track(
      e,
      (dx, dy, ev) => {
        let x = el.x + dx
        let y = el.y + dy
        const g = []
        const free = ev.altKey
        const sx = snap && !free && findSnap(ex.map((o) => x + o), tx, SNAP_PX / zoom)
        const sy = snap && !free && findSnap(ey.map((o) => y + o), ty, SNAP_PX / zoom)
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

  // Drags the image inside a shape. imgX/imgY work like object-position: the image's offset is
  // (box − image) · pct/100, so moving it by dx changes the percentage by dx·100/(box − image).
  const startPan = (e, el) => {
    e.preventDefault()
    const r = imageRect(el.w, el.h, el.props)
    if (!r) return
    const spanX = el.w - r.w
    const spanY = el.h - r.h
    const { imgX, imgY } = el.props
    const pct = (v) => Math.round(clamp(v, 0, 100) * 10) / 10
    track(e, (pdx, pdy) => {
      // The image moves along the shape's own axes, which differ from the page's once it is rotated.
      const { x: dx, y: dy } = vectorToLocal(el, pdx, pdy)
      setPropsLive(el.id, {
        imgX: spanX ? pct(imgX + (dx * 100) / spanX) : imgX,
        imgY: spanY ? pct(imgY + (dy * 100) / spanY) : imgY,
      })
    })
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

    if (el.rotation) return resizeRotated(e, el, { ratio, hasN, hasS, hasE, hasW, corner: handle.length === 2 })

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

  /**
   * Resizing a rotated element: the drag is measured along the element's own axes and the opposite
   * edge/corner stays where it is on the page, so the centre moves with the resize. No grid snapping,
   * since grid lines don't line up with a rotated box.
   */
  const resizeRotated = (e, el, { ratio, hasN, hasS, hasE, hasW, corner }) => {
    const cx = el.x + el.w / 2
    const cy = el.y + el.h / 2
    track(e, (pdx, pdy, ev) => {
      const { x: dx, y: dy } = vectorToLocal(el, pdx, pdy)
      // Edges relative to the original centre, in the element's frame.
      let left = -el.w / 2
      let right = el.w / 2
      let top = -el.h / 2
      let bottom = el.h / 2
      if (hasE) right += dx
      if (hasW) left += dx
      if (hasS) bottom += dy
      if (hasN) top += dy
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
      if (ev.shiftKey && corner) {
        if (w / h > ratio) h = w / ratio
        else w = h * ratio
        if (hasW) left = right - w
        else right = left + w
        if (hasN) top = bottom - h
        else bottom = top + h
      }
      const c = vectorToPage(el, (left + right) / 2, (top + bottom) / 2)
      setGeom(el.id, {
        x: Math.round(cx + c.x - w / 2),
        y: Math.round(cy + c.y - h / 2),
        w: Math.round(w),
        h: Math.round(h),
      })
    })
  }

  /** Rotates around the element's centre. Shift steps by 15°; with snapping on, it clicks to every 45°. */
  const startRotate = (e, el) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const r = canvasRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / zoom
    const py = (e.clientY - r.top) / zoom
    const cx = el.x + el.w / 2
    const cy = el.y + el.h / 2
    const angleAt = (x, y) => (Math.atan2(y - cy, x - cx) * 180) / Math.PI
    const start = angleAt(px, py)
    const base = el.rotation || 0

    track(e, (dx, dy, ev) => {
      let angle = base + angleAt(px + dx, py + dy) - start
      if (ev.shiftKey) angle = Math.round(angle / 15) * 15
      else if (snap && !ev.altKey) {
        const nearest = Math.round(angle / 45) * 45
        if (Math.abs(angle - nearest) < ROTATE_SNAP_DEG) angle = nearest
      }
      setGeom(el.id, { rotation: normalizeAngle(Math.round(angle)) })
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
                className={`el${el.locked ? ' locked' : ''}${editingId === el.id ? (el.type === 'shape' ? ' cropping' : ' editing') : ''}`}
                style={{ left: el.x, top: el.y, width: el.w, height: el.h, zIndex: i + 1, transform: rotationTransform(el) }}
                onPointerDown={(e) => startMove(e, el)}
                onDoubleClick={() => {
                  if (el.locked) return
                  if (TEXT_TYPES.includes(el.type) || (el.type === 'shape' && el.props.src)) onEdit(el.id)
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
              style={{
                left: selected.x,
                top: selected.y,
                width: selected.w,
                height: selected.h,
                transform: rotationTransform(selected),
              }}
            >
              {!selected.locked &&
                editingId !== selected.id &&
                HANDLES.map((h) => (
                  <span key={h} className={`handle handle-${h}`} onPointerDown={(e) => startResize(e, selected, h)} />
                ))}
              {!selected.locked && editingId !== selected.id && (
                <span
                  className="rotate-handle"
                  title="Kéo để xoay (Shift: bước 15°)"
                  onPointerDown={(e) => startRotate(e, selected)}
                  onDoubleClick={() => set((d) => ({ ...d, elements: d.elements.map((x) => (x.id === selected.id ? { ...x, rotation: 0 } : x)) }))}
                >
                  <Icon name="rotate" size={12} />
                </span>
              )}
              {cropping?.id === selected.id ? (
                <div className="crop-bar" onPointerDown={(e) => e.stopPropagation()}>
                  <button type="button" title="Thu nhỏ ảnh" onClick={() => zoomImage(selected, (z) => z / ZOOM_STEP)}>
                    <Icon name="minus" size={14} />
                  </button>
                  <span>{Math.round(selected.props.imgZoom * 100)}%</span>
                  <button type="button" title="Phóng to ảnh" onClick={() => zoomImage(selected, (z) => z * ZOOM_STEP)}>
                    <Icon name="plus" size={14} />
                  </button>
                  <span className="crop-hint">Kéo để dời · cuộn chuột để phóng</span>
                  <button type="button" className="crop-done" onClick={() => onEdit(null)}>
                    Xong
                  </button>
                </div>
              ) : (
                <span className="size-badge">
                  {selected.locked ? 'Đã khoá · ' : ''}
                  {selected.w} × {selected.h}
                  {selected.rotation ? ` · ${selected.rotation}°` : ''}
                </span>
              )}
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
