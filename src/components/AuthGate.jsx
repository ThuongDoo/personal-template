import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import App from '../App.jsx'
import Login from './Login.jsx'
import { loadDesign, saveDesign, saveUserProfile, signOut, uploadInlineImages } from '../lib/cloud.js'
import { normalizeDoc } from '../lib/elements.js'
import { auth, firebaseConfigured } from '../lib/firebase.js'
import { TEMPLATES } from '../lib/templates.js'

/** Where the app autosaved before designs moved to Firebase. */
const LEGACY_STORAGE_KEY = 'keo-tha-web:doc'

function readLegacyDoc() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) return normalizeDoc(JSON.parse(raw))
  } catch {
    // Corrupt or unavailable storage: nothing to migrate.
  }
  return null
}

/**
 * The user's design from Firestore. On their first visit, a design left in localStorage by the
 * pre-Firebase version is moved to the cloud (images to Storage); otherwise they start from a template.
 */
async function openDesign(uid) {
  const saved = await loadDesign(uid)
  if (saved) return saved
  const legacy = readLegacyDoc()
  if (!legacy) return TEMPLATES[0].create()
  const migrated = await uploadInlineImages(legacy)
  await saveDesign(uid, migrated)
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Ignore: at worst the next new account on this browser migrates it again.
  }
  return migrated
}

function Splash({ children }) {
  return (
    <div className="login">
      <div className="login-card">{children}</div>
    </div>
  )
}

export default function AuthGate() {
  // undefined: Firebase is still restoring the session; null: signed out.
  const [user, setUser] = useState(undefined)
  const [design, setDesign] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!firebaseConfigured) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setDesign(null)
      setError(null)
      if (u) saveUserProfile(u).catch((e) => console.error('Không lưu được thông tin người dùng', e))
    })
  }, [])

  const uid = user?.uid
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    openDesign(uid).then(
      (d) => !cancelled && setDesign(d),
      (e) => !cancelled && setError(e),
    )
    return () => {
      cancelled = true
    }
  }, [uid, attempt])

  if (!firebaseConfigured) {
    return (
      <Splash>
        <h1>Chưa cấu hình Firebase</h1>
        <p>
          Sao chép <code>.env.example</code> thành <code>.env.local</code>, điền thông tin dự án Firebase của bạn rồi
          khởi động lại <code>yarn dev</code>.
        </p>
      </Splash>
    )
  }
  if (user === undefined) return <Splash><p>Đang kiểm tra đăng nhập…</p></Splash>
  if (!user) return <Login />
  if (error) {
    return (
      <Splash>
        <h1>Không tải được thiết kế</h1>
        <p className="login-error">{error.message}</p>
        <button type="button" className="login-btn" onClick={() => { setError(null); setAttempt((n) => n + 1) }}>
          Thử lại
        </button>
        <button type="button" className="login-btn" onClick={signOut}>
          Đăng xuất
        </button>
      </Splash>
    )
  }
  if (!design) return <Splash><p>Đang tải thiết kế của bạn…</p></Splash>
  return <App key={user.uid} user={user} initialDoc={design} />
}
