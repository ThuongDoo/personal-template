import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import Canvas from './components/Canvas.jsx'
import Inspector from './components/Inspector.jsx'
import Layers from './components/Layers.jsx'
import Palette from './components/Palette.jsx'
import Preview from './components/Preview.jsx'
import Toolbar from './components/Toolbar.jsx'
import { ELEMENT_TYPES, applyPatch, clamp, createElement, normalizeDoc, uid } from './lib/elements.js'
import { download, exportHtml } from './lib/exportHtml.js'
import { readImageFile } from './lib/image.js'
import { TEMPLATES } from './lib/templates.js'
import { useHistory } from './lib/useHistory.js'
import './App.css'

const STORAGE_KEY = 'keo-tha-web:doc'
const SIDE_PANELS_WIDTH = 248 + 300

function loadDoc() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeDoc(JSON.parse(raw))
  } catch {
    // Corrupt or unavailable storage: fall back to the starter template.
  }
  return TEMPLATES[0].create()
}

const fitZoom = (available, pageWidth) => clamp(Math.floor((available / pageWidth) * 20) / 20, 0.25, 1)

export default function App() {
  const { doc, set, checkpoint, undo, redo, canUndo, canRedo } = useHistory(loadDoc)
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [zoom, setZoom] = useState(() => fitZoom(window.innerWidth - SIDE_PANELS_WIDTH - 80, doc.page.width))
  const [showGrid, setShowGrid] = useState(false)
  const [snap, setSnap] = useState(true)
  const [previewing, setPreviewing] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [tab, setTab] = useState('props')
  const workspaceRef = useRef(null)
  const canvasRef = useRef(null)
  const clipboard = useRef(null)

  const selected = doc.elements.find((el) => el.id === selectedId) ?? null

  // Autosave (debounced).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
        setSaveError(false)
      } catch {
        setSaveError(true)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [doc])

  const mutateElements = (fn, opts) => set((d) => ({ ...d, elements: fn(d.elements) }), opts)

  const updateElement = (id, patch, key) =>
    mutateElements((els) => els.map((el) => (el.id === id ? applyPatch(el, patch) : el)), {
      merge: key ? `${id}:${key}` : undefined,
    })

  const updatePage = (patch, key) =>
    set((d) => ({ ...d, page: { ...d.page, ...patch } }), { merge: key ? `page:${key}` : undefined })

  const insertElement = (el) => {
    mutateElements((els) => [...els, el])
    setSelectedId(el.id)
    setTab('props')
  }

  /** Center of the visible part of the canvas, in page coordinates. */
  const viewCenter = () => {
    const ws = workspaceRef.current.getBoundingClientRect()
    const cv = canvasRef.current.getBoundingClientRect()
    return {
      x: (ws.left + ws.width / 2 - cv.left) / zoom,
      y: (ws.top + Math.min(ws.height / 2, 320) - cv.top) / zoom,
    }
  }

  const placeAt = (w, h, pos) => ({
    x: Math.round(clamp(pos.x - w / 2, 0, Math.max(0, doc.page.width - w))),
    y: Math.round(clamp(pos.y - h / 2, 0, Math.max(0, doc.page.height - h))),
  })

  const addElement = (type, pos) => {
    const t = ELEMENT_TYPES[type]
    let at = placeAt(t.w, t.h, pos ?? viewCenter())
    // Clicking the palette repeatedly shouldn't stack elements exactly on top of each other.
    while (!pos && doc.elements.some((el) => el.x === at.x && el.y === at.y)) at = { x: at.x + 24, y: at.y + 24 }
    insertElement(createElement(type, at))
  }

  const addImageFiles = async (files, pos) => {
    const images = files.filter((f) => f.type.startsWith('image/'))
    for (const [i, file] of images.entries()) {
      try {
        const img = await readImageFile(file)
        const w = Math.min(480, img.width)
        const h = Math.round((w * img.height) / img.width)
        const at = placeAt(w, h, { x: pos.x + i * 24, y: pos.y + i * 24 })
        insertElement(createElement('image', { ...at, w, h, props: { src: img.src, alt: file.name.replace(/\.[^.]+$/, '') } }))
      } catch {
        alert(`Không đọc được ảnh "${file.name}".`)
      }
    }
  }

  const removeElement = (id) => {
    mutateElements((els) => els.filter((el) => el.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const duplicateElement = (src) => {
    const copy = { ...structuredClone(src), id: uid(), x: src.x + 20, y: src.y + 20, locked: false }
    mutateElements((els) => {
      const i = els.findIndex((el) => el.id === src.id)
      const next = [...els]
      next.splice(i < 0 ? next.length : i + 1, 0, copy)
      return next
    })
    setSelectedId(copy.id)
  }

  const pasteElement = () => {
    const src = clipboard.current
    if (!src) return
    const copy = { ...structuredClone(src), id: uid(), x: src.x + 20, y: src.y + 20 }
    clipboard.current = copy
    insertElement(copy)
  }

  const reorder = (id, where) =>
    mutateElements((els) => {
      const i = els.findIndex((el) => el.id === id)
      if (i < 0) return els
      const next = [...els]
      const [item] = next.splice(i, 1)
      const j = { front: next.length, back: 0, up: Math.min(next.length, i + 1), down: Math.max(0, i - 1) }[where]
      if (j === i) return els
      next.splice(j, 0, item)
      return next
    })

  const toggleFlag = (id, flag) => {
    const el = doc.elements.find((e) => e.id === id)
    if (el) updateElement(id, { [flag]: !el[flag] })
  }

  const commitText = (id, text) => {
    setEditingId(null)
    mutateElements((els) => {
      const el = els.find((e) => e.id === id)
      if (!el || el.props.text === text) return els
      return els.map((e) => (e.id === id ? applyPatch(e, { props: { text } }) : e))
    })
  }

  const onAction = (action) => {
    if (!selected) return
    if (action === 'delete') removeElement(selected.id)
    else if (action === 'duplicate') duplicateElement(selected)
    else if (action === 'lock') toggleFlag(selected.id, 'locked')
    else reorder(selected.id, action)
  }

  const fitToScreen = () => {
    const available = workspaceRef.current?.clientWidth ?? window.innerWidth - SIDE_PANELS_WIDTH
    setZoom(fitZoom(available - 80, doc.page.width))
  }

  const loadTemplate = (t) => {
    if (doc.elements.length && !confirm(`Thay trang hiện tại bằng mẫu "${t.name}"?\n(Bạn có thể hoàn tác bằng Ctrl+Z)`)) return
    set(t.create())
    setSelectedId(null)
    setEditingId(null)
  }

  const importJson = async (file) => {
    try {
      set(normalizeDoc(JSON.parse(await file.text())))
      setSelectedId(null)
    } catch {
      alert('Tệp không hợp lệ. Hãy chọn tệp JSON được lưu từ trình tạo trang này.')
    }
  }

  const fileBase = () =>
    (doc.page.title || 'trang-web')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .replace(/[^\w]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'trang-web'

  const openPreview = () => {
    document.activeElement?.blur?.()
    setEditingId(null)
    document.documentElement.requestFullscreen?.().catch(() => {})
    setPreviewing(true)
  }

  const closePreview = useCallback(() => {
    setPreviewing(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }, [])

  const openInNewTab = () => {
    const url = URL.createObjectURL(new Blob([exportHtml(doc)], { type: 'text/html' }))
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const onKeyDown = useEffectEvent((e) => {
    if (previewing) return
    const t = e.target
    const typing = t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
    if (typing) return
    const mod = e.ctrlKey || e.metaKey
    const key = e.key.toLowerCase()

    if (mod && key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
      return
    }
    if (mod && key === 'y') {
      e.preventDefault()
      redo()
      return
    }
    if (mod && key === 'v') {
      e.preventDefault()
      pasteElement()
      return
    }
    if (e.key === 'Escape') {
      setSelectedId(null)
      return
    }
    if (!selected) return

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      removeElement(selected.id)
    } else if (mod && key === 'd') {
      e.preventDefault()
      duplicateElement(selected)
    } else if (mod && key === 'c') {
      clipboard.current = structuredClone(selected)
    } else if (e.key === 'Enter' && ['heading', 'text', 'button'].includes(selected.type) && !selected.locked) {
      e.preventDefault()
      setEditingId(selected.id)
    } else if (e.key.startsWith('Arrow') && !selected.locked) {
      e.preventDefault()
      const step = e.shiftKey ? 10 : 1
      const dx = { ArrowLeft: -step, ArrowRight: step }[e.key] ?? 0
      const dy = { ArrowUp: -step, ArrowDown: step }[e.key] ?? 0
      updateElement(selected.id, { x: selected.x + dx, y: selected.y + dy }, 'nudge')
    }
  })

  useEffect(() => {
    const handler = (e) => onKeyDown(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="app">
      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoom={setZoom}
        onFit={fitToScreen}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        snap={snap}
        onToggleSnap={() => setSnap((v) => !v)}
        onImport={importJson}
        onExportJson={() => download(`${fileBase()}.json`, JSON.stringify(doc, null, 2), 'application/json')}
        onExportHtml={() => download(`${fileBase()}.html`, exportHtml(doc), 'text/html')}
        onPreview={openPreview}
        saveError={saveError}
      />

      <div className="main">
        <aside className="panel panel-left">
          <Palette onAdd={(type) => addElement(type)} onTemplate={loadTemplate} />
        </aside>

        <Canvas
          doc={doc}
          zoom={zoom}
          selectedId={selectedId}
          editingId={editingId}
          showGrid={showGrid}
          snap={snap}
          workspaceRef={workspaceRef}
          canvasRef={canvasRef}
          set={set}
          checkpoint={checkpoint}
          onSelect={setSelectedId}
          onEdit={setEditingId}
          onCommitText={commitText}
          onDropElement={addElement}
          onDropFiles={addImageFiles}
        />

        <aside className="panel panel-right">
          <div className="tabs">
            <button type="button" className={`tab${tab === 'props' ? ' active' : ''}`} onClick={() => setTab('props')}>
              Thuộc tính
            </button>
            <button type="button" className={`tab${tab === 'layers' ? ' active' : ''}`} onClick={() => setTab('layers')}>
              Lớp ({doc.elements.length})
            </button>
          </div>
          {tab === 'props' ? (
            <Inspector
              key={selected?.id ?? 'page'}
              el={selected}
              page={doc.page}
              onChange={updateElement}
              onPageChange={updatePage}
              onAction={onAction}
            />
          ) : (
            <Layers elements={doc.elements} selectedId={selectedId} onSelect={setSelectedId} onToggle={toggleFlag} />
          )}
        </aside>
      </div>

      {previewing && <Preview doc={doc} onClose={closePreview} onOpenTab={openInNewTab} />}
    </div>
  )
}
