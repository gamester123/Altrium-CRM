import { useState } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { friendlyError } from '../../lib/errors'
import { ROLES } from '../../auth/roles'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CreateUserForm({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(ROLES.REP)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const next = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (!email.trim()) next.email = 'Email is required.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That doesn\u2019t look like a valid email.'
    if (!password || password.length < 8) next.password = 'At least 8 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return // blocked client-side, nothing sent

    setBusy(true)
    try {
      await onSave({ name: name.trim(), email: email.trim(), password, role })
    } catch (err) {
      setServerError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {serverError && (
        <p role="alert" className="text-sm text-hot border border-hot/30 bg-hot/5 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <Input
        label="Name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Input
        label="Temporary password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <div className="space-y-1">
        <label className="block text-xs font-medium text-ink/60">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
        >
          {Object.values(ROLES).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:underline">
          Cancel
        </button>
        <Button type="submit" busy={busy} busyLabel="Creating…">
          Create account
        </Button>
      </div>
    </form>
  )
}
