import { useState } from 'react'
import Icon from './Icon.jsx'
import { signIn } from '../lib/cloud.js'

const ERRORS = {
  'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.',
  'auth/account-exists-with-different-credential':
    'Email này đã được dùng với một cách đăng nhập khác. Hãy đăng nhập bằng cách bạn đã dùng lần trước.',
  'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật trong Firebase Console.',
  'auth/unauthorized-domain': 'Tên miền này chưa được thêm vào "Authorized domains" trong Firebase Console.',
  'auth/network-request-failed': 'Không kết nối được mạng. Hãy kiểm tra kết nối và thử lại.',
}
// The user closed the popup or opened another one: not worth an error message.
const IGNORED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function FacebookLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
    </svg>
  )
}

export default function Login() {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const login = async (provider) => {
    setBusy(provider)
    setError('')
    try {
      await signIn(provider)
    } catch (e) {
      if (!IGNORED.includes(e.code)) setError(ERRORS[e.code] ?? `Đăng nhập thất bại (${e.code ?? e.message}).`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <span className="brand-mark login-mark">
          <Icon name="logo" size={24} />
        </span>
        <h1>Kéo Thả Web</h1>
        <p>Đăng nhập để tạo trang web. Thiết kế của bạn được lưu tự động lên đám mây và mở được trên mọi máy.</p>
        <button type="button" className="login-btn" onClick={() => login('google')} disabled={!!busy}>
          <GoogleLogo />
          {busy === 'google' ? 'Đang đăng nhập…' : 'Tiếp tục với Google'}
        </button>
        <button type="button" className="login-btn" onClick={() => login('facebook')} disabled={!!busy}>
          <FacebookLogo />
          {busy === 'facebook' ? 'Đang đăng nhập…' : 'Tiếp tục với Facebook'}
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  )
}
