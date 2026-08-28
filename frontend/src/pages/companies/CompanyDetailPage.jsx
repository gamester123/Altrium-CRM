import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCompany } from '../../api/companies'
import { friendlyError } from '../../lib/errors'
import Spinner from '../../components/ui/Spinner'
import ContactsSection from './ContactsSection'
import DealsSection from './DealsSection'

export default function CompanyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getCompany(id)
      .then((data) => {
        if (!data) throw new Error('Not found')
        setCompany(data)
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner label="Loading company" />

  if (error || !company) {
    return (
      <div className="max-w-2xl space-y-3">
        <p role="alert" className="text-sm text-hot border border-hot/30 bg-hot/5 rounded-lg px-3 py-2">
          {error || "We couldn't find that company."}
        </p>
        <Link to="/companies" className="text-signal underline text-sm">Back to companies</Link>
      </div>
    )
  }

  return (
    <section className="max-w-4xl space-y-8">
      <div>
        <button
          type="button"
          onClick={() => navigate('/companies')}
          className="text-xs text-ink/50 hover:text-ink transition mb-2"
        >
          ← Back to companies
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-1">{company.industry}</p>
            <h1 className="font-display text-2xl font-semibold text-ink">{company.name}</h1>
          </div>
        </div>
      </div>

      <ContactsSection companyId={company.id} />

      <DealsSection companyId={company.id} companyName={company.name} />
    </section>
  )
}
