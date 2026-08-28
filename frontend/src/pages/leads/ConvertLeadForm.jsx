import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import { friendlyError } from '../../lib/errors'
import { listCompanies } from '../../api/companies'

export default function ConvertLeadForm({ lead, onConvert, onCancel }) {
  const [companies, setCompanies] = useState([])
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listCompanies({ limit: 100 })
      .then((res) => setCompanies(res.data))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!companyId) {
      setError('Pick which company this lead belongs to.')
      return
    }
    setBusy(true)
    try {
      await onConvert(companyId)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-ink/70">
        This creates a new contact and deal from <strong>{lead.name}</strong>,
        linked to the company you pick below. This can't be undone.
      </p>

      {error && (
        <p role="alert" className="text-sm text-hot border border-hot/30 bg-hot/5 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40">Loading companies…</p>
      ) : (
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
        >
          <option value="">Select a company…</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:underline">
          Cancel
        </button>
        <Button type="submit" busy={busy} busyLabel="Converting…">
          Convert
        </Button>
      </div>
    </form>
  )
}
