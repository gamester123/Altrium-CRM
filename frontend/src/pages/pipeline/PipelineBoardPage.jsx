import { useCallback, useEffect, useMemo, useState } from 'react'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { listDeals, updateDealStage, reassignDeal } from '../../api/deals'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../auth/roles'
import { friendlyError } from '../../lib/errors'
import Spinner from '../../components/ui/Spinner'
import Toast from '../../components/ui/Toast'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import PipelineColumn from './PipelineColumn'
import DealCard from './DealCard'

const STAGES = ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost']
const LABELS = { new:'New', contacted:'Contacted', proposal:'Proposal', negotiation:'Negotiation', won:'Won', lost:'Lost' }

function groupByStage(deals) {
  const grouped = Object.fromEntries(STAGES.map((s) => [s, []]))
  deals.forEach((d) => grouped[d.stage] ? grouped[d.stage].push(d) : grouped.new.push(d))
  return grouped
}

function uniqueReps(deals) {
  const seen = new Map()
  deals.forEach((d) => {
    if (d.ownerId && !seen.has(String(d.ownerId))) seen.set(String(d.ownerId), d.ownerNameSnapshot || 'Unknown rep')
  })
  return Array.from(seen, ([id, name]) => ({ id, name }))
}

export default function PipelineBoardPage() {
  const { user } = useAuth()
  const isTeamView = [ROLES.MANAGER, ROLES.LEADERSHIP, ROLES.ADMIN].includes(user?.role)
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDeal, setActiveDeal] = useState(null)
  const [toast, setToast] = useState(null)
  const [repFilter, setRepFilter] = useState('')
  const [reassigning, setReassigning] = useState(null)
  const [newOwnerId, setNewOwnerId] = useState('')
  const [reassignBusy, setReassignBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    listDeals()
      .then((res) => setDeals(res.data))
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false))
  }, [repFilter])

  useEffect(() => { load() }, [load])

  const reps = useMemo(() => uniqueReps(deals), [deals])
  const visibleDeals = useMemo(() => (repFilter ? deals.filter((d) => String(d.ownerId) === String(repFilter)) : deals), [deals, repFilter])
  const dealsByStage = useMemo(() => groupByStage(visibleDeals), [visibleDeals])
  const totalValue = useMemo(() => visibleDeals.reduce((sum, d) => sum + Number(d.value || 0), 0), [visibleDeals])

  const findDeal = (id) => {
    for (const stage of STAGES) {
      const found = dealsByStage[stage].find((d) => d.id === id)
      if (found) return { deal: found, fromStage: stage }
    }
    return { deal: null, fromStage: null }
  }

  const onDragStart = (event) => setActiveDeal(findDeal(event.active.id).deal)
  const onDragCancel = () => setActiveDeal(null)

  const onDragEnd = async (event) => {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return
    const toStage = over.id
    const { deal, fromStage } = findDeal(active.id)
    if (!deal || !STAGES.includes(toStage) || fromStage === toStage) return
    const previous = deals
    setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, stage: toStage } : d))
    try {
      await updateDealStage(deal.id, toStage)
      setToast({ variant: 'success', message: `Moved to ${LABELS[toStage]}` })
    } catch (err) {
      setDeals(previous)
      setToast({ variant: 'error', message: friendlyError(err) })
    }
  }

  const openReassign = (deal) => {
    setReassigning(deal)
    setNewOwnerId(String(deal.ownerId || ''))
  }

  const submitReassign = async (e) => {
    e.preventDefault()
    if (!reassigning || !newOwnerId || String(newOwnerId) === String(reassigning.ownerId)) return
    setReassignBusy(true)
    try {
      const updated = await reassignDeal(reassigning.id, newOwnerId)
      setDeals((prev) => prev.map((d) => d.id === reassigning.id ? { ...d, ...updated } : d))
      setToast({ variant: 'success', message: `Deal reassigned to ${updated.ownerNameSnapshot || 'new owner'}` })
      setReassigning(null)
    } catch (err) {
      setToast({ variant: 'error', message: friendlyError(err) })
    } finally { setReassignBusy(false) }
  }

  if (loading) return <Spinner label="Loading pipeline" />
  if (error) return <section className="page-space"><p role="alert" className="alert-error">{error}</p></section>

  return (
    <section className="page-space pipeline-page">
      <div className="page-header">
        <div>
          <p className="crm-section-label">{isTeamView ? 'Team pipeline' : 'Sales pipeline'}</p>
          <h1 className="crm-page-heading">Deals</h1>
          <p className="page-subtitle">A focused view of every opportunity and where it stands.</p>
        </div>
        {isTeamView && (
          <div className="pipeline-filter"><span>Owner</span><select value={repFilter} onChange={(e) => setRepFilter(e.target.value)}><option value="">All reps</option>{reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
        )}
      </div>

      <div className="pipeline-overview">
        <div><span>Total deals</span><strong>{visibleDeals.length}</strong></div>
        <div><span>Pipeline value</span><strong className="tabular">{new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR',maximumFractionDigits:0}).format(totalValue)}</strong></div>
        <div><span>Won</span><strong>{dealsByStage.won.length}</strong></div>
        <div><span>Active</span><strong>{visibleDeals.filter((d) => !['won','lost'].includes(d.stage)).length}</strong></div>
      </div>

      <div className="pipeline-stage-strip">{STAGES.map((stage) => <div key={stage}><span>{LABELS[stage]}</span><strong>{dealsByStage[stage].length}</strong></div>)}</div>

      <DndContext collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
        <div className="pipeline-grid">
          {STAGES.map((stage) => <PipelineColumn key={stage} stage={stage} deals={dealsByStage[stage]} showOwner={isTeamView} onReassign={isTeamView ? openReassign : undefined} />)}
        </div>
        <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} showOwner={isTeamView} /> : null}</DragOverlay>
      </DndContext>

      <Modal open={Boolean(reassigning)} onClose={() => !reassignBusy && setReassigning(null)} title="Reassign deal">
        {reassigning && <form onSubmit={submitReassign} className="reassign-form">
          <div className="reassign-deal"><span className="crm-section-label">Deal</span><strong>{reassigning.title}</strong><span>{reassigning.companyNameSnapshot || 'No company'}</span></div>
          <label><span className="form-label">New owner</span><select className="crm-input" value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} required><option value="">Select a rep</option>{reps.map((r) => <option key={r.id} value={r.id}>{r.name}{String(r.id) === String(reassigning.ownerId) ? ' (current)' : ''}</option>)}</select></label>
          <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setReassigning(null)} disabled={reassignBusy}>Cancel</Button><Button type="submit" disabled={reassignBusy || !newOwnerId || String(newOwnerId) === String(reassigning.ownerId)}>{reassignBusy ? 'Reassigning…' : 'Confirm reassignment'}</Button></div>
        </form>}
      </Modal>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  )
}
