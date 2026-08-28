import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { friendlyError } from '../lib/errors'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await register(form)
      navigate('/dashboard', { replace: true })
    } catch (err) {
setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen grid md:grid-cols-2 bg-paper">
      <div className="hidden md:flex flex-col justify-between bg-ink text-paper p-12">
        <div className="font-display text-2xl font-semibold tracking-tight">CRM</div>

        <div className="space-y-6">
          <p className="font-display text-3xl leading-snug max-w-sm">
            Start your ledger.
          </p>
          <p className="text-paper/60 text-sm max-w-xs">
            New accounts start as a Rep. An admin can change your role later.
          </p>
        </div>

        <p className="font-mono text-xs text-paper/40">COMP50074 · Project CRM</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Create account</h1>
            <p className="text-ink/50 text-sm mt-1">Takes less than a minute.</p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-hot border border-hot/30 bg-hot/5 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <input name="name" required value={form.name} onChange={update}
                   placeholder="Full name" autoComplete="name"
                   className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal" />
            <input name="email" type="email" required value={form.email} onChange={update}
                   placeholder="Email" autoComplete="email"
                   className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal" />
            <input name="password" type="password" required value={form.password} onChange={update}
                   placeholder="Password" autoComplete="new-password"
                   className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal" />
          </div>

          <button type="submit" disabled={busy}
                  className="w-full bg-ink text-paper font-medium rounded-lg px-3 py-2.5 text-sm hover:bg-ink/90 transition disabled:opacity-50">
            {busy ? 'Creating…' : 'Create account'}
          </button>

          <p className="text-sm text-ink/60">
            Already have an account? <Link to="/login" className="text-signal font-medium hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  )
}