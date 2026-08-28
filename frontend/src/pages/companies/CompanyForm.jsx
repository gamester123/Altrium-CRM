import { useState } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { friendlyError } from '../../lib/errors'

const INDUSTRIES = [
  'Retail', 'Technology', 'Logistics', 'Manufacturing',
  'Finance', 'Healthcare', 'Education', 'Other',
]

export default function CompanyForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [industry, setIndustry] = useState(initial?.industry || INDUSTRIES[0])
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const next = {}
    if (!name.trim()) next.name = 'Company name is required.'
    if (!industry) next.industry = 'Pick an industry.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) 

    setBusy(true)
    try {
      await onSave({ name: name.trim(), industry })
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
        label="Company name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus
      />

      <div className="space-y-1">
        <label className="block text-xs font-medium text-ink/60">Industry</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40 ${
            errors.industry ? 'border-hot' : 'border-line'
          }`}
        >
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        {errors.industry && <p className="text-xs text-hot">{errors.industry}</p>}
      </div>

      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:underline">
          Cancel
        </button>
        <Button type="submit" busy={busy} busyLabel="Saving…">
          {initial ? 'Save changes' : 'Add company'}
        </Button>
      </div>
    </form>
  )
}
