import { useEffect, useId, useMemo, useRef } from 'react'
import { contentStyle, dividerLineStyle, youtubeEmbed } from '../lib/elements.js'
import { shapeSvg } from '../lib/shapes.js'

function Shape({ el, style, ghost }) {
  // useId keeps SVG ids unique when the same element renders in both the editor and preview.
  const id = 'shape' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const html = useMemo(() => shapeSvg(el, id, { ghost }), [el, id, ghost])
  return <div style={style} dangerouslySetInnerHTML={{ __html: html }} />
}

function TextBlock({ text, style, editing, onCommit }) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!editing || !node) return
    node.focus()
    const range = document.createRange()
    range.selectNodeContents(node)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }, [editing])

  if (!editing) {
    return (
      <div key="view" style={style}>
        {text}
      </div>
    )
  }

  // Separate key so React mounts a fresh node: the browser owns its contents while editing.
  return (
    <div
      key="edit"
      ref={ref}
      className="text-editing"
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => onCommit?.(e.currentTarget.innerText.replace(/\n$/, ''))}
      onKeyDown={(e) => {
        e.stopPropagation()
        // Ctrl+S finishes the edit; autosave then picks up the committed text.
        const mod = e.ctrlKey || e.metaKey
        if (e.key === 'Escape' || (mod && (e.key === 'Enter' || e.key.toLowerCase() === 's'))) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {text}
    </div>
  )
}

/** Renders an element's content. `mode` is 'editor' (inert, editable) or 'preview' (live links, video). */
export default function ElementContent({ el, mode, editing = false, onCommitText }) {
  const css = contentStyle(el)
  const p = el.props
  const isEditor = mode === 'editor'

  switch (el.type) {
    case 'heading':
    case 'text':
      return <TextBlock text={p.text} style={css} editing={editing} onCommit={onCommitText} />

    case 'button':
      if (isEditor) return <TextBlock text={p.text} style={css} editing={editing} onCommit={onCommitText} />
      return (
        <a
          href={p.href || '#'}
          target={p.newTab ? '_blank' : undefined}
          rel={p.newTab ? 'noopener noreferrer' : undefined}
          style={{ ...css, cursor: 'pointer' }}
        >
          {p.text}
        </a>
      )

    case 'image':
      if (!p.src) {
        return isEditor ? (
          <div style={css} className="placeholder">
            <span>Chưa có ảnh</span>
            <small>Chọn ảnh ở bảng bên phải</small>
          </div>
        ) : (
          <div style={css} />
        )
      }
      return (
        <div style={css}>
          <img
            src={p.src}
            alt={p.alt}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: p.fit, display: 'block' }}
          />
        </div>
      )

    case 'shape':
      return <Shape el={el} style={css} ghost={editing} />

    case 'divider':
      return (
        <div style={css}>
          <div style={dividerLineStyle(el)} />
        </div>
      )

    case 'video': {
      const src = youtubeEmbed(p.url)
      if (!src) {
        return (
          <div style={css} className={isEditor ? 'placeholder dark' : undefined}>
            {isEditor && (
              <>
                <span>Video YouTube</span>
                <small>Dán đường dẫn ở bảng bên phải</small>
              </>
            )}
          </div>
        )
      }
      return (
        <div style={css}>
          <iframe
            src={src}
            title="YouTube video"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 0, display: 'block', pointerEvents: isEditor ? 'none' : 'auto' }}
          />
        </div>
      )
    }

    default:
      return <div style={css} />
  }
}
