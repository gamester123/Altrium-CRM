import { useCallback, useEffect, useState } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { getDeal } from '../../api/deals'
import { friendlyError } from '../../lib/errors'
import Spinner from '../../components/ui/Spinner'
import ActivityTimeline from '../activities/ActivityTimeline'

const STAGE_STYLES = {
  new:         'bg-cold/10 text-cold',
  contacted:   'bg-cold/10 text-cold',
  proposal:    'bg-warm/10 text-warm',
  negotiation: 'bg-warm/10 text-warm',
  won:         'bg-signal/10 text-signal',
  lost:        'bg-hot/10 text-hot',
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n)
}

export default function DealDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // If we arrived via a link from the pipeline board or a company's deal
  // list, that row already had companyNameSnapshot/ownerNameSnapshot/
  // temperature — fields GET /deals/:id doesn't return. Use it as a base.
  const carriedDeal = location.state?.deal

  const [deal, setDeal] = useState(carriedDeal || null)
  const [loading, setLoading] = useState(!carriedDeal)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getDeal(id)
      .then((data) => {
        if (!data) throw new Error('Not found')
        // Server data wins for every field it actually returns. Fields it
        // omits entirely (companyNameSnapshot, contactNameSnapshot,
        // ownerNameSnapshot, temperature) fall through from carriedDeal,
        // since spreading an object that lacks a key never overwrites it.
        setDeal({ ...(carriedDeal || {}), ...data })
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false))
    // carriedDeal intentionally excluded — only relevant on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading && !deal) return <Spinner label="Loading deal" />

  if (error || !deal) {
    return (
      <div className="max-w-2xl space-y-3">
        <p role="alert" className="text-sm text-hot border border-hot/30 bg-hot/5 rounded-lg px-3 py-2">
          {error || "We couldn't find that deal."}
        </p>
        <Link to="/pipeline" className="text-signal underline text-sm">Back to pipeline</Link>
      </div>
    )
  }

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/pipeline')}
          className="text-xs text-ink/50 hover:text-ink transition mb-2"
        >
          ← Back to pipeline
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{deal.title}</h1>
            <p className="text-sm text-ink/50 mt-1">
              {deal.companyNameSnapshot || 'Unknown company'}
              {deal.contactNameSnapshot && ` · ${deal.contactNameSnapshot}`}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STAGE_STYLES[deal.stage] || 'bg-line text-ink/60'}`}>
            {deal.stage}
          </span>
        </div>

        <p className="tabular text-lg font-semibold text-ink mt-3">{formatCurrency(deal.value)}</p>
      </div>

      <ActivityTimeline dealId={deal.id} />
    </section>
  )
}
