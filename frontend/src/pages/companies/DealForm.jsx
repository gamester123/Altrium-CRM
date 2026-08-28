import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { friendlyError } from '../../lib/errors'
import { listContactsForCompany } from '../../api/contacts'

export default function DealForm({ initial, companyId, onSave, onCancel }) {
  const isEdit = Boolean(initial)

  const [title, setTitle] = useState(initial?.title || '')
  const [value, setValue] = useState(initial?.value ?? '')
  const [contactId, setContactId] = useState(initial?.contactId || '')
  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(!isEdit)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isEdit) return
    listContactsForCompany(companyId)
      .then((res) => setContacts(res.data))
      .finally(() => setLoadingContacts(false))
  }, [companyId, isEdit])

  const validate = () => {
    const next = {}
    if (!title.trim()) next.title = 'Give the deal a title.'
    if (value === '' || Number(value) <= 0) next.value = 'Enter a value greater than 0.'
    if (!isEdit && !contactId) next.contactId = 'Pick who this deal is with.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return

    setBusy(true)
    try {
      if (isEdit) {
        await onSave({ title: title.trim(), value: Number(value) })
      } else {
        // POST /deals only echoes back { id, title, stage } — the caller
        // needs the contact's name to display a usable row before the
        // next full refetch, so we hand it over here since this form is
        // the only place that has it in hand (from the dropdown it
        // already fetched).
        const chosenContact = contacts.find((c) => c.id === contactId)
        await onSave({
          title: title.trim(),
          value: Number(value),
          contactId,
          companyId,
          contactNameSnapshot: chosenContact?.name || '',
        })
      }
    } catch (err) {
      setServerError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  if (!isEdit && !loadingContacts && contacts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink/70">
          This company doesn't have any contacts yet. A deal needs to be linked
          to a person, so add a contact first.
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:underline">
            Cancel
          </button>
          <Link
            to="#"
            onClick={onCancel}
            className="text-sm bg-ink text-paper rounded-lg px-3 py-2.5 font-medium"
          >
            Add a contact instead
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {serverError && (
        <p role="alert" className="text-sm text-hot border border-hot/30 bg-hot/5 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <Input
        label="Deal title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        autoFocus
      />

      <Input
        label="Value"
        name="value"
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={errors.value}
      />

      {!isEdit && (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-ink/60">Contact</label>
          {loadingContacts ? (
            <p className="text-sm text-ink/40">Loading contacts…</p>
          ) : (
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40 ${
                errors.contactId ? 'border-hot' : 'border-line'
              }`}
            >
              <option value="">Select a contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          {errors.contactId && <p className="text-xs text-hot">{errors.contactId}</p>}
        </div>
      )}

      {isEdit && (
        <p className="text-xs text-ink/40">
          To change the stage, move this deal on the pipeline board.
        </p>
      )}

      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:underline">
          Cancel
        </button>
        <Button type="submit" busy={busy} busyLabel="Saving…">
          {isEdit ? 'Save changes' : 'Add deal'}
        </Button>
      </div>
    </form>
  )
}
