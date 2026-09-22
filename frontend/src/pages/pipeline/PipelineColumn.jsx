import { useDroppable } from '@dnd-kit/core'
import DealCard from './DealCard'

const LABELS={new:'New',contacted:'Contacted',proposal:'Proposal',negotiation:'Negotiation',won:'Won',lost:'Lost'}
const DOTS={new:'dot-slate',contacted:'dot-blue',proposal:'dot-violet',negotiation:'dot-amber',won:'dot-emerald',lost:'dot-red'}

export default function PipelineColumn({ stage, deals, showOwner = false, onReassign }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return <section ref={setNodeRef} className={`pipeline-column ${isOver ? 'is-over' : ''}`}>
    <header className="pipeline-column-head"><div><span className={`pipeline-dot ${DOTS[stage]}`} /><h3>{LABELS[stage]}</h3></div><span className="pipeline-count">{deals.length}</span></header>
    <div className="pipeline-column-body">{deals.length === 0 ? <div className="pipeline-empty"><span>+</span><p>Drop a deal here</p></div> : deals.map((deal) => <DealCard key={deal.id} deal={deal} showOwner={showOwner} onReassign={onReassign} />)}</div>
  </section>
}
