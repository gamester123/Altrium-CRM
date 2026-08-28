import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getContact } from '../../api/contacts'
import { friendlyError } from '../../lib/errors'
import Spinner from '../../components/ui/Spinner'
import ActivityTimeline from '../activities/ActivityTimeline'

export default function ContactDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getContact(id)
      .then((data) => {
        if (!data) throw new Error('Not found')
        setContact(data)
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner label="Loading contact" />

  if (error || !contact) {
    return (
      <div className="max-w-2xl space-y-3">
        <p role="alert" className="text-sm text-hot border border-hot/30 bg-hot/5 rounded-lg px-3 py-2">
          {error || "We couldn't find that contact."}
        </p>
        <Link to="/companies" className="text-signal underline text-sm">Back to companies</Link>
      </div>
    )
  }

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(`/companies/${contact.companyId}`)}
          className="text-xs text-ink/50 hover:text-ink transition mb-2"
        >
          ← Back to company
        </button>

        <h1 className="font-display text-2xl font-semibold text-ink">{contact.name}</h1>
        {contact.jobTitle && (
          <p className="text-sm text-ink/60 mt-0.5">{contact.jobTitle}</p>
        )}
        <p className="text-sm text-ink/50 mt-1 font-mono">{contact.email}</p>
        <p className="text-sm text-ink/50">{contact.phone}</p>
      </div>

      <ActivityTimeline contactId={contact.id} />
    </section>
  )
}
