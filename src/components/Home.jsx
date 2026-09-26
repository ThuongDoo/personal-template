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
import { cleanupMyStorage, getPublishOverview } from '../lib/api.js'
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

const OVERVIEW_POLL_MS = 20_000
const WAITING = ['pending', 'deploying']
const FAILED_BUILDS = ['ERROR', 'CANCELED']
const siteBuilding = (site) => !!site && !site.url && !FAILED_BUILDS.includes(site.status)

/**
 * Badges for one design card: whether it is the live site, and the state of its latest publish request.
 * A live design can also carry a pending/rejected badge when an update of it is under review.
 */
function publishBadges(designId, overview) {
  if (!overview) return []
  const badges = []
  const { site } = overview
  if (site?.designId === designId) {
    if (site.url) badges.push({ tone: 'live', label: 'Đang xuất bản', title: site.url })
    else if (siteBuilding(site)) badges.push({ tone: 'wait', label: 'Đang triển khai' })
  }
  const r = overview.requests[designId]
  if (r?.status === 'pending') {
    badges.push({
      tone: 'wait',
      label: site?.designId === designId ? 'Bản cập nhật chờ duyệt' : 'Chờ duyệt',
      title: `Gửi lúc ${formatTime(r.submittedAt && new Date(r.submittedAt))}`,
    })
  } else if (r?.status === 'deploying' && !badges.some((b) => b.label === 'Đang triển khai')) {
    badges.push({ tone: 'wait', label: 'Đang triển khai' })
  } else if (r?.status === 'rejected') {
    badges.push({ tone: 'bad', label: 'Bị từ chối', title: `Lý do: ${r.rejectReason}` })
  }
  return badges
}

/** Removal of unused uploads; a background chore, so failures (e.g. backend offline) are only logged. */
const tidyStorage = () => cleanupMyStorage().catch((e) => console.warn('Không dọn được tệp thừa', e))

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

  // Coming home usually follows editing: let the backend clear out uploads that are no longer used.
  useEffect(() => {
    tidyStorage()
  }, [user.uid])

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

  // Publish badges. Optional: if the backend is unreachable the cards simply show none.
  const [overview, setOverview] = useState(null)
  const [overviewTick, setOverviewTick] = useState(0)
  useEffect(() => {
    let cancelled = false
    getPublishOverview().then(
      (o) => !cancelled && setOverview(o),
      (e) => console.error('Không tải được trạng thái xuất bản', e),
    )
    return () => {
      cancelled = true
    }
  }, [user.uid, attempt, overviewTick])

  // While something waits for an admin or is building, check again now and then so the badge updates.
  const waiting = !!overview && (Object.values(overview.requests).some((r) => WAITING.includes(r.status)) || siteBuilding(overview.site))
  useEffect(() => {
    if (!waiting) return
    const t = setTimeout(() => setOverviewTick((n) => n + 1), OVERVIEW_POLL_MS)
    return () => clearTimeout(t)
  }, [waiting, overview])

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
    const live = overview?.site?.designId === design.id
    const warning = live ? '\n\nTrang này đang được xuất bản: bản công khai vẫn chạy cho tới khi bạn xuất bản trang khác.' : ''
    if (!confirm(`Xoá trang "${design.page.title}"? Không thể hoàn tác.${warning}`)) return
    setDesigns((list) => list.filter((d) => d.id !== design.id))
    try {
      await deleteDesign(user.uid, design.id)
      tidyStorage()
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
        {designs.map((d) => {
          const badges = publishBadges(d.id, overview)
          const liveUrl = overview?.site?.designId === d.id ? overview.site.url : null
          return (
            <div key={d.id} className={`card${liveUrl ? ' card-live' : ''}`}>
              <button type="button" className="card-open" onClick={() => openDesignRoute(d.id)}>
                <DesignThumb design={d} />
                <span className="card-text">
                  <strong>{d.page.title || 'Chưa đặt tên'}</strong>
                  <small>Sửa lần cuối: {formatTime(d.updatedAt)}</small>
                </span>
              </button>
              {badges.length > 0 && (
                <span className="card-badges">
                  {badges.map((b) => (
                    <span key={b.label} className={`badge badge-${b.tone}`} title={b.title}>
                      {b.label}
                    </span>
                  ))}
                </span>
              )}
              {liveUrl && (
                <a className="card-link" href={liveUrl} target="_blank" rel="noopener noreferrer">
                  {liveUrl.replace(/^https:\/\//, '')}
                  <Icon name="external" size={12} />
                </a>
              )}
              <button type="button" className="icon-btn danger card-delete" title="Xoá trang" onClick={() => remove(d)}>
                <Icon name="trash" />
              </button>
            </div>
          )
        })}
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
