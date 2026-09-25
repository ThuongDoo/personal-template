import { useEffect, useState } from 'react'
import DomainPicker from './DomainPicker.jsx'
import Icon from './Icon.jsx'
import { cancelDomainChange, cancelPublish, getPublishStatus, requestPublish, setMyDomain } from '../lib/api.js'
import { formatTime } from '../lib/format.js'
import { slugify } from '../lib/slug.js'

const POLL_MS = 5000
const FAILED = ['ERROR', 'CANCELED']
const toDate = (iso) => (iso ? new Date(iso) : null)

/** Whether the site is still being built, so the dialog should keep checking. */
const inProgress = (s) =>
  s?.request?.status === 'deploying' || (s?.site && !s.site.url && !FAILED.includes(s.site.status))

/** The user's one domain: pick it the first time, afterwards ask an admin to change it. */
function DomainSection({ domain, title, run, busy }) {
  const [changing, setChanging] = useState(false)

  if (!domain.name) {
    const choose = (name) => {
      const ok = confirm(
        `Chọn tên miền ${name}.${domain.rootDomain}?\n\nMỗi tài khoản chỉ có một tên miền. Sau này muốn đổi sẽ phải chờ quản trị viên duyệt.`,
      )
      if (ok) run(() => setMyDomain(name))
    }
    return (
      <section className="publish-section">
        <h4>1. Chọn tên miền</h4>
        <p className="hint">Trang web của bạn sẽ có địa chỉ này. Mỗi tài khoản chỉ có một tên miền.</p>
        <DomainPicker rootDomain={domain.rootDomain} initial={slugify(title)} submitLabel="Chọn tên miền này" busy={busy} onSubmit={choose} />
      </section>
    )
  }

  const pending = domain.status === 'pending' || domain.status === 'processing'
  return (
    <section className="publish-section">
      <h4>Tên miền</h4>
      <div className="domain-current">
        <strong>{domain.domain}</strong>
        {!pending && !changing && (
          <button type="button" className="btn" onClick={() => setChanging(true)} disabled={busy}>
            Đổi tên miền
          </button>
        )}
      </div>
      {pending && (
        <div className="publish-state pending">
          <strong>Đang chờ duyệt đổi sang {domain.pendingDomain}</strong>
          <span>Gửi lúc {formatTime(toDate(domain.submittedAt))}. Tên mới đã được giữ cho bạn trong lúc chờ.</span>
          {domain.status === 'pending' && (
            <button type="button" className="btn" onClick={() => run(cancelDomainChange)} disabled={busy}>
              Huỷ yêu cầu đổi
            </button>
          )}
        </div>
      )}
      {domain.status === 'rejected' && !changing && (
        <div className="publish-state rejected">
          <strong>Yêu cầu đổi tên miền bị từ chối</strong>
          <span>Lý do: {domain.rejectReason}</span>
        </div>
      )}
      {changing && (
        <>
          <p className="hint">Đổi tên miền cần quản trị viên duyệt. Trang vẫn chạy ở tên miền cũ cho tới khi được duyệt.</p>
          <DomainPicker
            rootDomain={domain.rootDomain}
            submitLabel="Gửi yêu cầu đổi"
            busy={busy}
            onCancel={() => setChanging(false)}
            onSubmit={(name) => run(() => setMyDomain(name)).then((ok) => ok && setChanging(false))}
          />
        </>
      )}
    </section>
  )
}

/**
 * Publishing a page to the user's domain: they send it for review, an admin approves (the backend then
 * deploys it) or rejects it with a reason. `save()` must resolve to true once the latest edits are in
 * Firestore, since the backend publishes what is saved there.
 */
export default function PublishDialog({ designId, page, save, onClose }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false
    getPublishStatus(designId).then(
      (s) => !cancelled && setStatus(s),
      (e) => !cancelled && setError(e.message),
    )
    return () => {
      cancelled = true
    }
  }, [designId, refresh])

  const polling = inProgress(status)
  useEffect(() => {
    if (!polling) return
    const t = setTimeout(() => setRefresh((n) => n + 1), POLL_MS)
    return () => clearTimeout(t)
  }, [polling, status])

  /** Runs an API action, then reloads the status. Resolves to whether it succeeded. */
  const run = async (action) => {
    setBusy(true)
    setError('')
    try {
      await action()
      setRefresh((n) => n + 1)
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const submit = () =>
    run(async () => {
      if (!(await save())) throw new Error('Chưa lưu được thay đổi lên đám mây, nên chưa thể gửi duyệt.')
      await requestPublish(designId)
    })

  const { request, site, domain } = status ?? {}
  const state = request?.status
  const hasDomain = !!domain?.name
  const liveHere = site?.designId === designId
  const canSubmit = hasDomain && state !== 'pending' && state !== 'deploying'

  let requestState = null
  if (state === 'pending') {
    requestState = (
      <div className="publish-state pending">
        <strong>Đang chờ quản trị viên duyệt</strong>
        <span>Gửi lúc {formatTime(toDate(request.submittedAt))}. Trang sẽ được xuất bản ngay khi được duyệt.</span>
        <small>Những chỉnh sửa sau thời điểm gửi sẽ không có trong lần xuất bản này.</small>
      </div>
    )
  } else if (state === 'deploying') {
    requestState = (
      <div className="publish-state pending">
        <strong>Đã được duyệt, đang triển khai…</strong>
      </div>
    )
  } else if (state === 'rejected') {
    requestState = (
      <div className="publish-state rejected">
        <strong>Yêu cầu xuất bản bị từ chối</strong>
        <span>Lý do: {request.rejectReason}</span>
        <small>Hãy chỉnh sửa theo góp ý rồi gửi lại.</small>
      </div>
    )
  }

  let siteState = null
  if (site && liveHere) {
    siteState = site.url ? (
      <div className="publish-state live">
        <strong>Trang này đang được xuất bản</strong>
        <a href={site.url} target="_blank" rel="noopener noreferrer">
          {site.url}
          <Icon name="external" size={12} />
        </a>
        <small>Cập nhật lần cuối: {formatTime(toDate(site.deployedAt))}</small>
      </div>
    ) : (
      !FAILED.includes(site.status) && (
        <div className="publish-state pending">
          <strong>Đang triển khai trang…</strong>
        </div>
      )
    )
  } else if (site) {
    siteState = (
      <div className="publish-state pending">
        <strong>Tên miền đang hiển thị trang “{site.title || 'khác'}”</strong>
        <span>Xuất bản trang này sẽ thay thế trang đó, vì mỗi tài khoản chỉ có một trang web công khai.</span>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-label="Xuất bản trang"
        onKeyDown={(e) => e.key === 'Escape' && !busy && onClose()}
      >
        <h3>Xuất bản trang</h3>

        {!status ? (
          !error && <p className="hint">Đang tải…</p>
        ) : (
          <>
            <DomainSection domain={domain} title={page.title} run={run} busy={busy} />

            <section className="publish-section">
              <h4>{hasDomain ? 'Xuất bản' : '2. Xuất bản'}</h4>
              <div className="site-card">
                <span className="favicon-preview">
                  {page.favicon ? <img src={page.favicon} alt="" /> : <Icon name="image" size={16} />}
                </span>
                <span className="site-card-text">
                  <strong>{page.title || 'Chưa đặt tiêu đề'}</strong>
                  <small>{hasDomain ? domain.domain : 'Chưa có tên miền'}</small>
                </span>
              </div>
              <p className="hint">
                Tiêu đề và icon web sửa ở mục “Website” trong Cài đặt trang (bấm vào chỗ trống trên trang). Để tránh spam,
                mỗi lần xuất bản cần quản trị viên duyệt.
              </p>
              {siteState}
              {requestState}
            </section>
          </>
        )}

        {error && <p className="warn">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Đóng
          </button>
          {state === 'pending' && (
            <button type="button" className="btn" onClick={() => run(() => cancelPublish(designId))} disabled={busy}>
              Huỷ yêu cầu xuất bản
            </button>
          )}
          {status && (
            <button
              type="button"
              className="btn primary"
              onClick={submit}
              disabled={busy || !canSubmit}
              title={hasDomain ? undefined : 'Hãy chọn tên miền trước'}
            >
              {busy ? 'Đang gửi…' : liveHere && site?.url ? 'Gửi bản cập nhật để duyệt' : 'Gửi yêu cầu xuất bản'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
