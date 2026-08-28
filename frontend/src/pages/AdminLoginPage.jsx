import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { friendlyError } from '../lib/errors'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginPage() {
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm((current) => ({ ...current, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await loginAdmin(form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-screen login-screen-admin">
      <div className="login-panel">
        <div className="login-brand">
          <div className="login-logo">A</div>
          <span>Altrium</span>
        </div>
        <div className="login-copy">
          <p className="crm-section-label">Management access</p>
          <h1>Sign in</h1>
          <p>Use your management credentials to access the workspace.</p>
        </div>
        {error && <p role="alert" className="login-error">{error}</p>}
        <form onSubmit={submit} className="login-form">
          <label>
            <span>Email</span>
            <input name="email" type="email" required value={form.email} onChange={update} placeholder="name@company.com" autoComplete="username" className="crm-input" />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" required value={form.password} onChange={update} placeholder="Enter your password" autoComplete="current-password" className="crm-input" />
          </label>
          <button type="submit" disabled={busy} className="crm-primary login-submit">
            {busy ? 'Signing in…' : 'Sign in'}<span>→</span>
          </button>
        </form>
        <p className="login-footnote">Authorized management access only</p>
      </div>
    </main>
  )
}
