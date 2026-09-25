import { useRef } from 'react'
import Icon from './Icon.jsx'

const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2]

const SAVE_LABELS = {
  saved: 'Đã lưu lên đám mây',
  pending: 'Có thay đổi chưa lưu…',
  saving: 'Đang lưu…',
  error: 'Không lưu được — kiểm tra kết nối mạng',
  'too-large': 'Trang quá lớn để lưu (giới hạn 1MB) — hãy bớt phần tử',
}

export default function Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoom,
  onFit,
  showGrid,
  onToggleGrid,
  snap,
  onToggleSnap,
  onImport,
  onExportJson,
  onExportHtml,
  onPreview,
  saveState,
  notice,
  user,
  onSignOut,
}) {
  const saveError = saveState === 'error' || saveState === 'too-large'
  const status = notice ?? { text: SAVE_LABELS[saveState], error: saveError }
  const fileRef = useRef(null)
  const zoomStep = (dir) => {
    const next = dir > 0 ? ZOOMS.find((z) => z > zoom + 0.001) : [...ZOOMS].reverse().find((z) => z < zoom - 0.001)
    if (next) onZoom(next)
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="logo" size={18} />
        </span>
        <span>Kéo Thả Web</span>
      </div>

      <div className="tool-group">
        <button type="button" className="icon-btn" title="Hoàn tác (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
          <Icon name="undo" />
        </button>
        <button type="button" className="icon-btn" title="Làm lại (Ctrl+Y)" disabled={!canRedo} onClick={onRedo}>
          <Icon name="redo" />
        </button>
      </div>

      <div className="tool-group">
        <button type="button" className="icon-btn" title="Thu nhỏ" onClick={() => zoomStep(-1)}>
          <Icon name="minus" />
        </button>
        <button type="button" className="zoom-label" title="Về 100%" onClick={() => onZoom(1)}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="icon-btn" title="Phóng to" onClick={() => zoomStep(1)}>
          <Icon name="plus" />
        </button>
        <button type="button" className="icon-btn" title="Vừa màn hình" onClick={onFit}>
          <Icon name="fit" />
        </button>
      </div>

      <div className="tool-group">
        <button type="button" className={`icon-btn${showGrid ? ' on' : ''}`} title="Lưới (hít theo ô 10px)" onClick={onToggleGrid}>
          <Icon name="grid" />
        </button>
        <button type="button" className={`icon-btn${snap ? ' on' : ''}`} title="Đường gióng thông minh" onClick={onToggleSnap}>
          <Icon name="magnet" />
        </button>
      </div>

      <div className="spacer" />

      <span className={`save-state${status.error ? ' error' : ''}`} title={status.text}>
        {status.text}
      </span>

      <div className="tool-group">
        <button type="button" className="btn ghost" title="Mở tệp JSON đã lưu" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={14} />
          Mở
        </button>
        <button type="button" className="btn ghost" title="Lưu thiết kế ra tệp JSON" onClick={onExportJson}>
          <Icon name="download" size={14} />
          Lưu
        </button>
        <button type="button" className="btn ghost" title="Xuất thành tệp HTML hoàn chỉnh" onClick={onExportHtml}>
          <Icon name="code" size={14} />
          Xuất HTML
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) onImport(f)
          }}
        />
      </div>

      <button type="button" className="btn primary" onClick={onPreview}>
        <Icon name="play" size={14} />
        Xem trước
      </button>

      <div className="user-chip" title={[user.displayName, user.email].filter(Boolean).join('\n')}>
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="user-initial">{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
        )}
        <button type="button" className="btn ghost" onClick={onSignOut}>
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
