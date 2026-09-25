import { useEffect, useMemo, useState } from 'react'
import DesignThumb from './DesignThumb.jsx'
import Icon from './Icon.jsx'
import UserChip from './UserChip.jsx'
import {
  DesignLimitError,
  MAX_DESIGNS,
  createDesign,
  deleteDesign,
  listDesigns,
  listTemplates,
  signOut,
  uploadInlineImages,
} from '../lib/cloud.js'
import { normalizeDoc } from '../lib/elements.js'
import { goAdmin, openDesignRoute } from '../lib/route.js'
import { formatTime } from '../lib/format.js'
import { BLANK_TEMPLATE } from '../lib/templates.js'

/** Where the app autosaved before designs moved to Firebase. */
const LEGACY_STORAGE_KEY = 'keo-tha-web:doc'
const legacyMigrations = new Map()

/**
 * Turns a design left in localStorage by the pre-Firebase version into a cloud design, once.
 * Memoized per user so React StrictMode's double effect can't create it twice.
 */
function migrateLegacyDesign(uid) {
  if (!legacyMigrations.has(uid)) {
    legacyMigrations.set(
      uid,
      (async () => {
        let legacy
        try {
          const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
          legacy = raw && normalizeDoc(JSON.parse(raw))
        } catch {
          return // Corrupt or unavailable storage: nothing to migrate.
        }
        if (!legacy) return
        await createDesign(uid, await uploadInlineImages(legacy))
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY)
        } catch {
          // Ignore: at worst the next account on this browser imports it too.
        }
      })(),
    )
  }
  return legacyMigrations.get(uid)
}

export default function Home({ user, isAdmin }) {
  const [designs, setDesigns] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [creating, setCreating] = useState(null)
  const [cloudTemplates, setCloudTemplates] = useState([])
  // The blank page, then the templates admins published. Previews are made once:
  // create() returns a fresh copy every call.
  const templates = useMemo(
    () =>
      [BLANK_TEMPLATE, ...cloudTemplates].map((t) => ({
        ...t,
        preview: t.create(),
      })),
    [cloudTemplates],
  )

  useEffect(() => {
    let cancelled = false
    listTemplates().then(
      (list) => !cancelled && setCloudTemplates(list),
      // The blank page still works, so this isn't worth an error on screen.
      (e) => console.error('Không tải được mẫu trang', e),
    )
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    migrateLegacyDesign(user.uid)
      .catch((e) => {
        // At the page limit the old design just stays in localStorage for a later visit.
        if (!(e instanceof DesignLimitError)) console.error('Không chuyển được thiết kế cũ lên đám mây', e)
      })
      .then(() => listDesigns(user.uid))
      .then(
        (list) => !cancelled && setDesigns(list),
        (e) => !cancelled && setLoadError(e),
      )
    return () => {
      cancelled = true
    }
  }, [user.uid, attempt])

  const create = async (template) => {
    setCreating(template.id)
    try {
      openDesignRoute(await createDesign(user.uid, template.create()))
    } catch (e) {
      setCreating(null)
      if (e instanceof DesignLimitError) {
        // The list on screen was stale (e.g. a page was created in another tab): refresh it.
        alert(`${e.message}. Hãy xoá một trang cũ để tạo trang mới.`)
        setAttempt((n) => n + 1)
        return
      }
      console.error(e)
      alert('Không tạo được trang mới. Hãy kiểm tra kết nối mạng.')
    }
  }

  const full = !!designs && designs.length >= MAX_DESIGNS
  const canCreate = !!designs && !full && !creating

  const remove = async (design) => {
    if (!confirm(`Xoá trang "${design.page.title}"? Không thể hoàn tác.`)) return
    setDesigns((list) => list.filter((d) => d.id !== design.id))
    try {
      await deleteDesign(user.uid, design.id)
    } catch (e) {
      console.error(e)
      alert('Không xoá được trang.')
      setAttempt((n) => n + 1)
    }
  }

  const retry = () => {
    setLoadError(null)
    setDesigns(null)
    setAttempt((n) => n + 1)
  }

  let saved
  if (loadError) {
    saved = (
      <div className="home-empty">
        <p className="login-error">Không tải được danh sách trang.</p>
        <button type="button" className="btn" onClick={retry}>
          Thử lại
        </button>
      </div>
    )
  } else if (!designs) {
    saved = <p className="home-empty">Đang tải…</p>
  } else if (!designs.length) {
    saved = <p className="home-empty">Bạn chưa có trang nào. Hãy tạo trang đầu tiên ở trên.</p>
  } else {
    saved = (
      <div className="card-grid">
        {designs.map((d) => (
          <div key={d.id} className="card">
            <button type="button" className="card-open" onClick={() => openDesignRoute(d.id)}>
              <DesignThumb design={d} />
              <span className="card-text">
                <strong>{d.page.title || 'Chưa đặt tên'}</strong>
                <small>Sửa lần cuối: {formatTime(d.updatedAt)}</small>
              </span>
            </button>
            <button type="button" className="icon-btn danger card-delete" title="Xoá trang" onClick={() => remove(d)}>
              <Icon name="trash" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="home">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="logo" size={18} />
          </span>
          <span>Kéo Thả Web</span>
        </div>
        <div className="spacer" />
        {isAdmin && (
          <button type="button" className="btn ghost" onClick={goAdmin} title="Xem thiết kế của người dùng, tạo mẫu trang">
            <Icon name="sliders" size={14} />
            Quản trị
          </button>
        )}
        <UserChip user={user} onSignOut={signOut} />
      </header>

      <main className="home-main">
        <section>
          <h2>Tạo trang mới</h2>
          {full && (
            <p className="limit-note">
              Bạn đã dùng hết {MAX_DESIGNS}/{MAX_DESIGNS} trang. Hãy xoá một trang cũ ở bên dưới để tạo trang mới.
            </p>
          )}
          <div className="card-grid">
            {templates.map((t) => (
              <button key={t.id} type="button" className="card card-open" onClick={() => create(t)} disabled={!canCreate}>
                {t.id === 'blank' ? (
                  <span className="thumb thumb-blank">
                    <Icon name="plus" size={28} />
                  </span>
                ) : (
                  <DesignThumb design={t.preview} />
                )}
                <span className="card-text">
                  <strong>{creating === t.id ? 'Đang tạo…' : t.name}</strong>
                  <small>{t.description}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>
            Trang đã lưu
            {designs && (
              <span className={`limit-count${full ? ' full' : ''}`}>
                {designs.length}/{MAX_DESIGNS}
              </span>
            )}
          </h2>
          {saved}
        </section>
      </main>
    </div>
  )
}
