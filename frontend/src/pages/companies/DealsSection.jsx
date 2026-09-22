import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDealsForCompany, createDeal, updateDeal, deleteDeal } from '../../api/deals'
import { friendlyError } from '../../lib/errors'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmAction from '../../components/ui/ConfirmAction'
import Button from '../../components/ui/Button'
import DealForm from './DealForm'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../auth/roles'

const STAGES = ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost']

const STAGE_STYLES = {
  new:         'bg-cold/10 text-cold',
  contacted:   'bg-cold/10 text-cold',
  proposal:    'bg-warm/10 text-warm',
  negotiation: 'bg-warm/10 text-warm',
  won:         'bg-signal/10 text-signal',
  lost:        'bg-hot/10 text-hot',
}

function StageBadge({ stage }) {
  const style = STAGE_STYLES[stage] || 'bg-line text-ink/60'
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${style}`}>
      {stage}
    </span>
  )
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n)
}

export default function DealsSection({ companyId, companyName }) {
  const { user } = useAuth()
  const canSeeCreators = [ROLES.MANAGER, ROLES.ADMIN].includes(user?.role)
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stageFilter, setStageFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback((stage) => {
    setLoading(true)
    setError(null)
    listDealsForCompany(companyId, { stage })
      .then((res) => setDeals(res.data))
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { load(stageFilter) }, [load, stageFilter])

  const onClear = () => setStageFilter('')

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (deal) => { setEditing(deal); setModalOpen(true) }

  const onSave = async (payload) => {
    if (editing) {
      const previous = deals
      setDeals(deals.map((d) => (d.id === editing.id ? { ...d, ...payload } : d)))
      try {
        await updateDeal(editing.id, payload)
      } catch (err) {
        setDeals(previous)
        throw err
      }
    } else {
      const enrichedPayload = { ...payload, companyNameSnapshot: companyName, stage: 'new' }
      const created = await createDeal(payload)
      setDeals([{ ...enrichedPayload, ...created }, ...deals])
    }
    setModalOpen(false)
  }

  const onDelete = async (id) => {
    const previous = deals
    setDeals(deals.filter((d) => d.id !== id))
    try {
      await deleteDeal(id)
    } catch (err) {
      setDeals(previous)
      setError(friendlyError(err))
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Deal',
      render: (d) => (
        // Passing the row as navigation state lets the detail page fill
        // in company/contact/owner names — GET /deals/:id doesn't return
        // them, but this row (from GET /deals) already has most of them.
        <Link
          to={`/deals/${d.id}`}
          state={{ deal: d }}
          className="font-medium text-ink hover:text-signal transition"
        >
          {d.title}
        </Link>
      ),
    },
    { key: 'value', header: 'Value', className: 'tabular text-ink/80', render: (d) => formatCurrency(d.value) },
    { key: 'stage', header: 'Stage', render: (d) => <StageBadge stage={d.stage} /> },
    { key: 'contact', header: 'Contact', className: 'text-ink/60', render: (d) => d.contactNameSnapshot || '—' },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => openEdit(d)} className="text-xs text-ink/50 hover:text-ink transition">
            Edit
          </button>
          <ConfirmAction label="Delete" confirmLabel="Delete" onConfirm={() => onDelete(d.id)} />
        </div>
      ),
    },
  ]

  return (
    <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Deals</h2>
        <Button size="sm" onClick={openAdd}>Add deal</Button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        {stageFilter && (
          <button type="button" onClick={onClear} className="text-xs text-ink/50 hover:text-ink transition">
            Clear
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-hot border border-hot/30 bg-hot/5 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={deals}
        rowKey={(d) => d.id}
        loading={loading}
        empty={stageFilter ? `No deals in "${stageFilter}" for this company.` : 'No deals yet for this company.'}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit deal' : 'Add deal'}
      >
        <DealForm initial={editing} companyId={companyId} onSave={onSave} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
