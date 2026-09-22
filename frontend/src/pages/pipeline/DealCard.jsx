import { useDraggable } from '@dnd-kit/core'
import { Link } from 'react-router-dom'

function formatCurrency(n) { return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n || 0) }

export default function DealCard({ deal, showOwner = false, onReassign }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return <article ref={setNodeRef} style={style} {...listeners} {...attributes} className={`pipeline-deal-card ${isDragging ? 'is-dragging' : ''}`}>
    <div className="pipeline-deal-top"><span className="deal-value">{formatCurrency(deal.value)}</span>{deal.temperature && <span className={`temp-pill temp-${deal.temperature}`}>{deal.temperature}</span>}</div>
    <p className="pipeline-deal-title">{deal.title}</p>
    <p className="pipeline-deal-company">{deal.companyNameSnapshot || 'No company'}</p>
    {showOwner && <div className="pipeline-owner"><span className="owner-avatar">{(deal.ownerNameSnapshot || '?').slice(0,1).toUpperCase()}</span><span className="owner-name">{deal.ownerNameSnapshot || 'Unassigned'}</span></div>}
    <div className="pipeline-card-actions">
      <Link to={`/deals/${deal.id}`} state={{ deal }} onPointerDown={(e) => e.stopPropagation()}>Open deal</Link>
      {showOwner && onReassign && <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onReassign(deal) }}>Reassign</button>}
    </div>
  </article>
}
