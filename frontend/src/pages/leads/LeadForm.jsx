import { useState } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { friendlyError } from '../../lib/errors'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SOURCES = ['Referral', 'Website', 'Cold call', 'Event', 'LinkedIn', 'Other']

export default function LeadForm({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState(SOURCES[0])
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const next = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (email.trim() && !EMAIL_RE.test(email.trim())) next.email = 'That doesn\u2019t look like a valid email.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return

    setBusy(true)
    try {
      const payload = { name: name.trim(), email: email.trim(), phone: phone.trim(), source }
      await onSave(payload)
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
        label="Email (optional)"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Input
        label="Phone (optional)"
        name="phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <div className="space-y-1">
        <label className="block text-xs font-medium text-ink/60">Source</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
        >
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:underline">
          Cancel
        </button>
        <Button type="submit" busy={busy} busyLabel="Saving…">
          Add lead
        </Button>
      </div>
    </form>
  )
}
