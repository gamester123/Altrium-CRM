import { useCallback,useEffect,useMemo,useState } from 'react'
import { DndContext,DragOverlay,closestCenter } from '@dnd-kit/core'
import { listDeals,updateDealStage,reassignDeal,bulkReassignDeals,downloadDealsCsv,restoreDeal,runArchiveCheck } from '../../api/deals'
import { listReps } from '../../api/users'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../auth/roles'
import { friendlyError } from '../../lib/errors'
import Spinner from '../../components/ui/Spinner'
import Toast from '../../components/ui/Toast'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import PipelineColumn from './PipelineColumn'
import DealCard from './DealCard'
const STAGES=['new','contacted','proposal','negotiation','won','lost']; const LABELS={new:'New',contacted:'Contacted',proposal:'Proposal',negotiation:'Negotiation',won:'Won',lost:'Lost'}
const money=n=>new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR',maximumFractionDigits:0}).format(n||0)
function groupByStage(ds){const g=Object.fromEntries(STAGES.map(s=>[s,[]]));ds.forEach(d=>(g[d.stage]||g.new).push(d));return g}
export default function PipelineBoardPage(){
 const {user}=useAuth(); const team=[ROLES.MANAGER,ROLES.LEADERSHIP,ROLES.ADMIN].includes(user?.role); const admin=user?.role===ROLES.ADMIN
 const [deals,setDeals]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null),[active,setActive]=useState(null),[toast,setToast]=useState(null),[rep,setRep]=useState(''),[stageFilter,setStageFilter]=useState(''),[stuckOnly,setStuckOnly]=useState(false),[archived,setArchived]=useState(false),[selected,setSelected]=useState([]),[reps,setReps]=useState([]),[bulkOwner,setBulkOwner]=useState(''),[bulkOpen,setBulkOpen]=useState(false),[busy,setBusy]=useState(false)
 const load=useCallback(()=>{setLoading(true);setError(null);listDeals({ownerId:rep,stuckOnly,showArchived:archived}).then(r=>setDeals(r.data||[])).catch(e=>setError(friendlyError(e))).finally(()=>setLoading(false))},[rep,stuckOnly,archived])
 useEffect(()=>{load()},[load]); useEffect(()=>{if(team)listReps().then(r=>setReps(r.data||r||[])).catch(()=>{})},[team])
 const visible=useMemo(()=>{
  let rows=deals.filter(d=>archived?Boolean(d.archivedAt):!d.archivedAt)
  if(stageFilter)rows=rows.filter(d=>d.stage===stageFilter)
  return rows
},[deals,stageFilter,archived]), byStage=useMemo(()=>groupByStage(visible),[visible]); const activeDeals=visible.filter(d=>!['won','lost'].includes(d.stage)); const pipelineValue=activeDeals.reduce((s,d)=>s+Number(d.value||0),0); const won=visible.filter(d=>d.stage==='won').reduce((s,d)=>s+Number(d.value||0),0); const lost=visible.filter(d=>d.stage==='lost').reduce((s,d)=>s+Number(d.value||0),0)
 const find=id=>STAGES.flatMap(s=>byStage[s]).find(d=>String(d.id)===String(id));
 const selectedDeal =
  selected.length === 1
    ? deals.find(d => String(d.id) === String(selected[0]))
    : null

const currentOwnerId = selectedDeal?.ownerId || ''

const currentOwnerName =
  selectedDeal?.ownerNameSnapshot ||
  reps.find(
    r => String(r.id || r._id) === String(currentOwnerId)
  )?.name ||
  'Unassigned'

const availableReps = reps.filter(
  r => String(r.id || r._id) !== String(currentOwnerId)
)
 const dragEnd=async({active,over})=>{setActive(null);if(!over)return;const deal=find(active.id),to=over.id;if(!deal||!STAGES.includes(to)||deal.stage===to)return;const prev=deals;setDeals(ds=>ds.map(d=>d.id===deal.id?{...d,stage:to}:d));try{const u=await updateDealStage(deal.id,to);setDeals(ds=>ds.map(d=>d.id===deal.id?{...d,...u}:d));setToast({variant:'success',message:`Moved to ${LABELS[to]}`})}catch(e){setDeals(prev);setToast({variant:'error',message:friendlyError(e)})}}
 const toggle=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 const submitBulk=async e=>{e.preventDefault();if(!bulkOwner||!selected.length)return;setBusy(true);try{const r=await bulkReassignDeals(selected,bulkOwner);const ok=(r.results||[]).filter(x=>x.success);const owner=reps.find(x=>String(x.id||x._id)===String(bulkOwner));setDeals(ds=>ds.map(d=>ok.some(x=>String(x.dealId)===String(d.id))?{...d,ownerId:bulkOwner,ownerNameSnapshot:owner?.name||d.ownerNameSnapshot}:d));setToast({variant:'success',message:`Reassigned ${ok.length} deal${ok.length===1?'':'s'}`});setSelected([]);setBulkOpen(false)}catch(e){setToast({variant:'error',message:friendlyError(e)})}finally{setBusy(false)}}
 const exportCsv=()=>downloadDealsCsv({...(rep?{ownerId:rep}:{}),...(stageFilter?{stage:stageFilter}:{}),...(archived?{showArchived:'true'}:{})}).then(()=>setToast({variant:'success',message:'CSV report downloaded'})).catch(e=>setToast({variant:'error',message:friendlyError(e)}))
 const restore=async id=>{try{await restoreDeal(id);setDeals(ds=>ds.filter(d=>d.id!==id));setToast({variant:'success',message:'Deal restored'})}catch(e){setToast({variant:'error',message:friendlyError(e)})}}
 if(loading)return <Spinner label="Loading pipeline"/>; if(error)return <section className="page-space"><p role="alert" className="alert-error">{error}</p></section>
 return <section className="page-space pipeline-page">
  <div className="page-header"><div><p className="crm-section-label">{team?'Team pipeline':'Sales pipeline'}</p><h1 className="crm-page-heading">Deals</h1><p className="page-subtitle">Track opportunity movement, temperature and deals that need attention.</p></div><div className="flex flex-wrap gap-2">{team&&<Button size="sm" variant="secondary" onClick={()=>setBulkOpen(true)} disabled={!selected.length}>Reassign selected ({selected.length})</Button>}{team&&<Button size="sm" variant="secondary" onClick={exportCsv}>Export CSV</Button>}{admin&&<Button size="sm" variant="secondary" onClick={()=>runArchiveCheck().then(r=>{setToast({variant:'success',message:`Archive check: ${r.archivedCount} archived, ${r.markedForDeletionCount} marked`});load()}).catch(e=>setToast({variant:'error',message:friendlyError(e)}))}>Run archive check</Button>}</div></div>
  <div className="pipeline-controls">{team&&<label>Owner <select value={rep} onChange={e=>setRep(e.target.value)}><option value="">All reps</option>{reps.map(r=><option key={r.id||r._id} value={r.id||r._id}>{r.name}</option>)}</select></label>}<label>Stage <select value={stageFilter} onChange={e=>setStageFilter(e.target.value)}><option value="">All stages</option>{STAGES.map(s=><option key={s} value={s}>{LABELS[s]}</option>)}</select></label><label className="check-control"><input type="checkbox" checked={stuckOnly} onChange={e=>setStuckOnly(e.target.checked)}/> Show Stuck Only</label>{admin&&<label className="check-control"><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/> Show archived</label>}</div>
  <div className="pipeline-overview"><div><span>Total deals</span><strong>{visible.length}</strong></div><div><span>Pipeline value</span><strong className="tabular">{money(pipelineValue)}</strong></div><div><span>Won amount</span><strong className="tabular">{money(won)}</strong></div><div><span>Lost amount</span><strong className="tabular">{money(lost)}</strong></div></div>
  {archived&&admin?<div className="archive-list">{visible.length===0?<p>No archived deals.</p>:visible.map(d=><div key={d.id}><div><strong>{d.title}</strong><span>{d.companyNameSnapshot||'No company'} · {d.stage}</span></div><Button size="sm" onClick={()=>restore(d.id)} disabled={Boolean(d.pendingDeletionAt)}>Restore</Button></div>)}</div>:<><div className="pipeline-stage-strip">{STAGES.map(s=><div key={s}><span>{LABELS[s]}</span><strong>{byStage[s].length}</strong></div>)}</div><DndContext collisionDetection={closestCenter} onDragStart={e=>setActive(find(e.active.id))} onDragCancel={()=>setActive(null)} onDragEnd={dragEnd}><div className="pipeline-grid">{STAGES.map(s=><PipelineColumn key={s} stage={s} deals={byStage[s]} showOwner={team} onReassign={team?(d=>{setBulkOwner('');setSelected([d.id]);setBulkOpen(true)}):undefined} selectable={team} selected={selected} onSelect={toggle}/>)}</div><DragOverlay>{active?<DealCard deal={active} showOwner={team}/>:null}</DragOverlay></DndContext></>}
  <Modal
  open={bulkOpen}
  onClose={() => !busy && setBulkOpen(false)}
  title={selected.length > 1 ? 'Reassign selected deals' : 'Reassign deal'}
>
  <form onSubmit={submitBulk} className="reassign-form">

    <p className="text-sm text-slate-500">
      {selected.length} deal{selected.length === 1 ? '' : 's'} selected.
    </p>

    {selected.length === 1 && (
      <div className="space-y-2">
        <label className="crm-label">
          Current owner
        </label>

        <div className="crm-input bg-slate-50">
          {currentOwnerName}
        </div>
      </div>
    )}

    <div className="space-y-2">
      <label className="crm-label">
        Reassign to
      </label>

      <select
        className="crm-input"
        value={bulkOwner}
        onChange={e => setBulkOwner(e.target.value)}
        required
      >
        <option value="">
          Select a different sales rep
        </option>

        {(selected.length === 1
          ? availableReps
          : reps
        ).map(r => (
          <option
            key={r.id || r._id}
            value={r.id || r._id}
          >
            {r.name}
          </option>
        ))}
      </select>
    </div>

    <div className="modal-actions">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setBulkOpen(false)}
      >
        Cancel
      </Button>

      <Button
        type="submit"
        disabled={
          busy ||
          !bulkOwner ||
          (
            selected.length === 1 &&
            String(bulkOwner) === String(currentOwnerId)
          )
        }
      >
        {busy
          ? 'Reassigning…'
          : 'Confirm reassignment'}
      </Button>
    </div>

  </form>
</Modal>
  <Toast toast={toast} onDismiss={()=>setToast(null)}/>
 </section>
}
