import { useEffect, useState } from 'react'
import DesignThumb from './DesignThumb.jsx'
import Icon from './Icon.jsx'
import Preview from './Preview.jsx'
import TemplateDialog from './TemplateDialog.jsx'
import UserChip from './UserChip.jsx'
import { Segmented } from './fields.jsx'
import {
  approveDomainRequest,
  approvePublishRequest,
  getPublishRequest,
  listDomainRequests,
  listPublishRequests,
  rejectDomainRequest,
  rejectPublishRequest,
} from '../lib/api.js'
import { ROLES, deleteTemplate, listDesigns, listTemplates, listUsers, signOut } from '../lib/cloud.js'
import { normalizeDoc } from '../lib/elements.js'
import { exportHtml } from '../lib/exportHtml.js'
import { formatTime } from '../lib/format.js'
import { goHome } from '../lib/route.js'

/** Runs `load` whenever `deps` change and returns `{ data, error, reload }`; data is null while loading. */
function useLoad(load, deps) {
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([...deps, attempt])
  // Results are tagged with the key they were loaded for; anything older reads as "loading".
  const [state, setState] = useState({ key: null, data: null, error: null })
  useEffect(() => {
    let cancelled = false
    load().then(
      (data) => !cancelled && setState({ key, data, error: null }),
      (error) => !cancelled && setState({ key, data: null, error }),
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const current = state.key === key
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    reload: () => setAttempt((n) => n + 1),
  }
}

function openInNewTab(design) {
  const url = URL.createObjectURL(new Blob([exportHtml(design)], { type: 'text/html' }))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function Status({ error, loading, empty, onRetry }) {
  if (error) {
    return (
      <div className="home-empty">
        <p className="login-error">Không tải được dữ liệu. Bạn có quyền quản trị không?</p>
        <button type="button" className="btn" onClick={onRetry}>
          Thử lại
        </button>
      </div>
    )
  }
  if (loading) return <p className="home-empty">Đang tải…</p>
  return <p className="home-empty">{empty}</p>
}

function UserDesigns({ user, onPreview, onMakeTemplate }) {
  const designs = useLoad(() => listDesigns(user.uid), [user.uid])
  if (!designs.data?.length) {
    return (
      <Status
        error={designs.error}
        loading={!designs.data}
        empty="Người dùng này chưa có trang nào."
        onRetry={designs.reload}
      />
    )
  }
  return (
    <div className="card-grid">
      {designs.data.map((d) => (
        <div key={d.id} className="card">
          <button type="button" className="card-open" onClick={() => onPreview(d)} title="Xem trước">
            <DesignThumb design={d} />
            <span className="card-text">
              <strong>{d.page.title || 'Chưa đặt tên'}</strong>
              <small>Sửa lần cuối: {formatTime(d.updatedAt)}</small>
            </span>
          </button>
          <div className="card-actions">
            <button type="button" className="btn" onClick={() => onPreview(d)}>
              <Icon name="play" size={14} />
              Xem
            </button>
            <button type="button" className="btn primary" onClick={() => onMakeTemplate(d, { uid: user.uid, designId: d.id })}>
              Lưu làm mẫu
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function UsersTab({ onPreview, onMakeTemplate }) {
  const users = useLoad(listUsers, [])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const q = search.trim().toLowerCase()
  const shown = (users.data ?? []).filter(
    (u) => !q || [u.displayName, u.email, u.uid].some((v) => v?.toLowerCase().includes(q)),
  )

  return (
    <div className="admin-users">
      <aside className="admin-user-list">
        <input
          className="input"
          type="search"
          placeholder="Tìm theo tên, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!users.data ? (
          <Status error={users.error} loading onRetry={users.reload} />
        ) : (
          <ul>
            {shown.map((u) => (
              <li key={u.uid}>
                <button
                  type="button"
                  className={`admin-user${selected?.uid === u.uid ? ' active' : ''}`}
                  onClick={() => setSelected(u)}
                >
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="user-initial">{(u.displayName || u.email || '?')[0].toUpperCase()}</span>
                  )}
                  <span className="admin-user-text">
                    <strong>{u.displayName || '(không tên)'}</strong>
                    <small>{u.email || u.uid}</small>
                  </span>
                  {u.role === ROLES.admin && <span className="role-badge">Admin</span>}
                </button>
              </li>
            ))}
            {!shown.length && <li className="home-empty">Không tìm thấy người dùng.</li>}
          </ul>
        )}
      </aside>
      <section className="admin-user-designs">
        {selected ? (
          <>
            <h2>
              Trang của {selected.displayName || selected.email || selected.uid}
              <small className="admin-sub">Đăng nhập gần nhất: {formatTime(selected.lastLoginAt)}</small>
            </h2>
            <UserDesigns key={selected.uid} user={selected} onPreview={onPreview} onMakeTemplate={onMakeTemplate} />
          </>
        ) : (
          <p className="home-empty">Chọn một người dùng để xem các trang của họ.</p>
        )}
      </section>
    </div>
  )
}

function TemplatesTab({ onPreview, version }) {
  const templates = useLoad(listTemplates, [version])

  const remove = async (t) => {
    if (!confirm(`Xoá mẫu "${t.name}"? Trang người dùng đã tạo từ mẫu này không bị ảnh hưởng.`)) return
    try {
      await deleteTemplate(t.templateId)
    } catch (e) {
      console.error(e)
      alert('Không xoá được mẫu.')
    }
    templates.reload()
  }

  if (!templates.data?.length) {
    return (
      <Status
        error={templates.error}
        loading={!templates.data}
        empty='Chưa có mẫu nào. Vào tab "Người dùng" để lưu một thiết kế làm mẫu.'
        onRetry={templates.reload}
      />
    )
  }
  return (
    <div className="card-grid">
      {templates.data.map((t) => {
        const design = t.create()
        return (
          <div key={t.id} className="card">
            <button type="button" className="card-open" onClick={() => onPreview(design)} title="Xem trước">
              <DesignThumb design={design} />
              <span className="card-text">
                <strong>{t.name}</strong>
                <small>{t.description || '—'}</small>
              </span>
            </button>
            <button type="button" className="icon-btn danger card-delete" title="Xoá mẫu" onClick={() => remove(t)}>
              <Icon name="trash" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

const REQUEST_FILTERS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
]

function RequestRow({ request: r, onPreview, onDone }) {
  const [busy, setBusy] = useState(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const run = async (kind, action) => {
    setBusy(kind)
    setError('')
    try {
      onDone(await action())
    } catch (e) {
      setError(e.message)
      setBusy(null)
    }
  }

  const preview = () =>
    run('preview', async () => {
      const full = await getPublishRequest(r.id)
      onPreview(normalizeDoc(full.design))
      setBusy(null)
      return null
    })

  // No confirmation: the user was already warned that approving replaces (and deletes) their old site.
  const approve = () =>
    run('approve', async () => {
      const res = await approvePublishRequest(r.id)
      const missing = res.deployment?.missingImages
        ? ` ${res.deployment.missingImages} ảnh không còn trong Storage nên đã bị bỏ trống.`
        : ''
      return `Đã duyệt "${r.title}". ${res.deployment?.url ? `Trang ở ${res.deployment.url}` : 'Vercel đang triển khai trang.'}${missing}`
    })

  const reject = (e) => {
    e.preventDefault()
    run('reject', async () => {
      await rejectPublishRequest(r.id, reason.trim())
      return `Đã từ chối "${r.title}".`
    })
  }

  const who = r.user?.name || r.user?.email || r.uid
  return (
    <li className="request">
      <div className="request-main">
        <strong>{r.title}</strong>
        <small>
          {who}
          {r.user?.name && r.user?.email ? ` · ${r.user.email}` : ''} · gửi lúc {formatTime(r.submittedAt && new Date(r.submittedAt))}
        </small>
        {r.domain && <small>Tên miền: {r.domain}</small>}
        {r.status === 'rejected' && <small className="warn">Lý do từ chối: {r.rejectReason}</small>}
        {r.status === 'approved' && <small>Duyệt lúc {formatTime(r.reviewedAt && new Date(r.reviewedAt))}</small>}
        {r.lastError && r.status === 'pending' && <small className="warn">Lần duyệt trước bị lỗi: {r.lastError}</small>}
        {error && <small className="warn">{error}</small>}
        {rejecting && (
          <form className="request-reject" onSubmit={reject}>
            <input
              className="input"
              autoFocus
              required
              maxLength={500}
              placeholder="Lý do từ chối (người dùng sẽ thấy)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button type="submit" className="btn danger-btn" disabled={!!busy || !reason.trim()}>
              {busy === 'reject' ? 'Đang gửi…' : 'Từ chối'}
            </button>
            <button type="button" className="btn" onClick={() => setRejecting(false)} disabled={!!busy}>
              Huỷ
            </button>
          </form>
        )}
      </div>
      <div className="request-actions">
        <button type="button" className="btn" onClick={preview} disabled={!!busy}>
          <Icon name="play" size={14} />
          {busy === 'preview' ? 'Đang tải…' : 'Xem'}
        </button>
        {r.status === 'pending' && !rejecting && (
          <>
            <button type="button" className="btn" onClick={() => setRejecting(true)} disabled={!!busy}>
              Từ chối
            </button>
            <button type="button" className="btn primary" onClick={approve} disabled={!!busy}>
              {busy === 'approve' ? 'Đang xuất bản…' : 'Duyệt'}
            </button>
          </>
        )}
      </div>
    </li>
  )
}

function PublishRequestsTab({ onPreview, onNotice }) {
  const [filter, setFilter] = useState('pending')
  const requests = useLoad(() => listPublishRequests(filter), [filter])

  return (
    <section>
      <div className="request-filter">
        <Segmented value={filter} options={REQUEST_FILTERS} onChange={setFilter} />
      </div>
      {!requests.data?.length ? (
        <Status
          error={requests.error}
          loading={!requests.data}
          empty={filter === 'pending' ? 'Không có yêu cầu nào đang chờ duyệt.' : 'Chưa có yêu cầu nào.'}
          onRetry={requests.reload}
        />
      ) : (
        <ul className="requests">
          {requests.data.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              onPreview={onPreview}
              onDone={(message) => {
                if (!message) return
                onNotice(message)
                requests.reload()
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function DomainRequestRow({ request: r, onDone }) {
  const [busy, setBusy] = useState(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const run = async (kind, action, message) => {
    setBusy(kind)
    setError('')
    try {
      await action()
      onDone(message)
    } catch (e) {
      setError(e.message)
      setBusy(null)
    }
  }

  const approve = () => {
    if (!confirm(`Đổi tên miền của ${who} từ ${r.domain} sang ${r.pendingDomain}?`)) return
    run('approve', () => approveDomainRequest(r.uid), `Đã đổi tên miền sang ${r.pendingDomain}.`)
  }

  const reject = (e) => {
    e.preventDefault()
    run('reject', () => rejectDomainRequest(r.uid, reason.trim()), `Đã từ chối đổi sang ${r.pendingDomain}.`)
  }

  const who = r.user?.name || r.user?.email || r.uid
  return (
    <li className="request">
      <div className="request-main">
        <strong>
          {r.status === 'approved' ? r.domain : `${r.domain} → ${r.pendingDomain ?? '—'}`}
        </strong>
        <small>
          {who}
          {r.user?.name && r.user?.email ? ` · ${r.user.email}` : ''}
          {r.submittedAt && ` · gửi lúc ${formatTime(new Date(r.submittedAt))}`}
        </small>
        {r.status === 'rejected' && <small className="warn">Lý do từ chối: {r.rejectReason}</small>}
        {r.status === 'approved' && r.reviewedAt && <small>Duyệt lúc {formatTime(new Date(r.reviewedAt))}</small>}
        {r.lastError && r.status === 'pending' && <small className="warn">Lần duyệt trước bị lỗi: {r.lastError}</small>}
        {error && <small className="warn">{error}</small>}
        {rejecting && (
          <form className="request-reject" onSubmit={reject}>
            <input
              className="input"
              autoFocus
              required
              maxLength={500}
              placeholder="Lý do từ chối (người dùng sẽ thấy)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button type="submit" className="btn danger-btn" disabled={!!busy || !reason.trim()}>
              {busy === 'reject' ? 'Đang gửi…' : 'Từ chối'}
            </button>
            <button type="button" className="btn" onClick={() => setRejecting(false)} disabled={!!busy}>
              Huỷ
            </button>
          </form>
        )}
      </div>
      {r.status === 'pending' && !rejecting && (
        <div className="request-actions">
          <button type="button" className="btn" onClick={() => setRejecting(true)} disabled={!!busy}>
            Từ chối
          </button>
          <button type="button" className="btn primary" onClick={approve} disabled={!!busy}>
            {busy === 'approve' ? 'Đang đổi…' : 'Duyệt'}
          </button>
        </div>
      )}
    </li>
  )
}

function DomainRequestsTab({ onNotice }) {
  const [filter, setFilter] = useState('pending')
  const requests = useLoad(() => listDomainRequests(filter), [filter])

  return (
    <section>
      <div className="request-filter">
        <Segmented value={filter} options={REQUEST_FILTERS} onChange={setFilter} />
      </div>
      {!requests.data?.length ? (
        <Status
          error={requests.error}
          loading={!requests.data}
          empty={filter === 'pending' ? 'Không có yêu cầu đổi tên miền nào đang chờ.' : 'Chưa có yêu cầu nào.'}
          onRetry={requests.reload}
        />
      ) : (
        <ul className="requests">
          {requests.data.map((r) => (
            <DomainRequestRow
              key={r.uid}
              request={r}
              onDone={(message) => {
                onNotice(message)
                requests.reload()
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default function AdminPage({ user }) {
  const [tab, setTab] = useState('requests')
  const [previewing, setPreviewing] = useState(null)
  const [making, setMaking] = useState(null)
  const [notice, setNotice] = useState('')
  // Bumped after a template is saved so the templates tab refetches.
  const [templatesVersion, setTemplatesVersion] = useState(0)

  return (
    <div className="home">
      <header className="topbar">
        <button type="button" className="brand brand-btn" title="Về trang chủ" onClick={goHome}>
          <span className="brand-mark">
            <Icon name="home" size={16} />
          </span>
          <span>Trang chủ</span>
        </button>
        <strong className="admin-title">Quản trị</strong>
        <div className="spacer" />
        {notice && <span className="save-state">{notice}</span>}
        <UserChip user={user} onSignOut={signOut} />
      </header>

      <div className="tabs admin-tabs">
        <button type="button" className={`tab${tab === 'requests' ? ' active' : ''}`} onClick={() => setTab('requests')}>
          Duyệt xuất bản
        </button>
        <button type="button" className={`tab${tab === 'domains' ? ' active' : ''}`} onClick={() => setTab('domains')}>
          Đổi tên miền
        </button>
        <button type="button" className={`tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
          Người dùng
        </button>
        <button type="button" className={`tab${tab === 'templates' ? ' active' : ''}`} onClick={() => setTab('templates')}>
          Mẫu đã tạo
        </button>
      </div>

      <main className="home-main">
        {tab === 'requests' ? (
          <PublishRequestsTab onPreview={setPreviewing} onNotice={setNotice} />
        ) : tab === 'domains' ? (
          <DomainRequestsTab onNotice={setNotice} />
        ) : tab === 'users' ? (
          <UsersTab onPreview={setPreviewing} onMakeTemplate={(design, source) => setMaking({ design, source })} />
        ) : (
          <section>
            <TemplatesTab onPreview={setPreviewing} version={templatesVersion} />
          </section>
        )}
      </main>

      {previewing && (
        <Preview doc={previewing} onClose={() => setPreviewing(null)} onOpenTab={() => openInNewTab(previewing)} />
      )}
      {making && (
        <TemplateDialog
          design={making.design}
          source={making.source}
          onClose={() => setMaking(null)}
          onDone={(message) => {
            setMaking(null)
            setNotice(message)
            setTemplatesVersion((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}
