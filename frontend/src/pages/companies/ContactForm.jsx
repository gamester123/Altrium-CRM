import { useState } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { friendlyError } from '../../lib/errors'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactForm({ initial, companyId, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle || '')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const next = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (!email.trim()) next.email = 'Email is required.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That doesn\u2019t look like a valid email.'
    if (!phone.trim()) next.phone = 'Phone number is required.'
    // jobTitle is intentionally optional — not every contact has a role
    // worth recording, and it wasn't part of the original AC.
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return

    setBusy(true)
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        companyId,
      })
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
        label="Phone"
        name="phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
      />
      <Input
        label="Job title (optional)"
        name="jobTitle"
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
      />

      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:underline">
          Cancel
        </button>
        <Button type="submit" busy={busy} busyLabel="Saving…">
          {initial ? 'Save changes' : 'Add contact'}
        </Button>
      </div>
    </form>
  )
}
