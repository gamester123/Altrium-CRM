import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listLeads, createLead, updateLeadStatus, convertLead, deleteLeadPermanently } from '../../api/leads'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../auth/roles'
import { friendlyError } from '../../lib/errors'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmAction from '../../components/ui/ConfirmAction'
import Button from '../../components/ui/Button'
import LeadForm from './LeadForm'
import ConvertLeadForm from './ConvertLeadForm'

const STATUSES = ['new', 'contacted', 'qualified', 'lost']
const STATUS_STYLES = { new:'status-neutral', contacted:'status-blue', qualified:'status-violet', lost:'status-red', converted:'status-green' }
const TEMP_STYLES = { hot:'temp-hot', warm:'temp-warm', cold:'temp-cold' }
function StatusBadge({ status }) { return <span className={`status-pill ${STATUS_STYLES[status] || 'status-neutral'}`}>{status}</span> }
function TempDot({ temperature }) { return <span className={`temp-dot ${TEMP_STYLES[temperature] || 'temp-cold'}`} title={temperature} /> }

export default function LeadsListPage() {
  const { user } = useAuth(); const navigate = useNavigate(); const isAdmin = user?.role === ROLES.ADMIN
  const [leads,setLeads]=useState([]); const [total,setTotal]=useState(0); const [loading,setLoading]=useState(true); const [error,setError]=useState(null); const [statusFilter,setStatusFilter]=useState(''); const [query,setQuery]=useState(''); const [addOpen,setAddOpen]=useState(false); const [convertingLead,setConvertingLead]=useState(null); const [convertedIds,setConvertedIds]=useState(new Set())
  const load=useCallback((status)=>{setLoading(true);setError(null);listLeads({status}).then(res=>{setLeads(res.data);setTotal(typeof res.total==='number'?res.total:res.data.length)}).catch(err=>setError(friendlyError(err))).finally(()=>setLoading(false))},[])
  useEffect(()=>{load(statusFilter)},[load,statusFilter])
  const filtered=useMemo(()=>query.trim()?leads.filter(l=>`${l.name} ${l.source||''}`.toLowerCase().includes(query.toLowerCase())):leads,[leads,query])
  const stats=useMemo(()=>({new:leads.filter(l=>l.status==='new').length,qualified:leads.filter(l=>l.status==='qualified').length,hot:leads.filter(l=>l.temperature==='hot').length}),[leads])
  const onAdd=async(payload)=>{const created=await createLead(payload);setLeads([{...payload,...created},...leads]);setTotal(t=>t+1);setAddOpen(false)}
  const onStatusChange=async(id,status)=>{const previous=leads;setLeads(leads.map(l=>l.id===id?{...l,status}:l));try{await updateLeadStatus(id,status)}catch(err){setLeads(previous);setError(friendlyError(err))}}
  const onConvert=async(companyId)=>{const {dealId}=await convertLead(convertingLead.id,companyId);setConvertedIds(prev=>new Set(prev).add(convertingLead.id));setLeads(leads.map(l=>l.id===convertingLead.id?{...l,status:'qualified'}:l));setConvertingLead(null);navigate(`/deals/${dealId}`)}
  const onDelete=async(id)=>{const previous=leads;setLeads(leads.filter(l=>l.id!==id));setTotal(t=>Math.max(0,t-1));try{await deleteLeadPermanently(id)}catch(err){setLeads(previous);setTotal(t=>t+1);setError(friendlyError(err))}}
  const columns=[
    {key:'name',header:'Lead',render:l=><div className="record-primary"><span className="record-avatar">{(l.name||'?').slice(0,1).toUpperCase()}</span><div><strong>{l.name}</strong><span>{l.source||'Direct'}</span></div></div>},
    {key:'status',header:'Status',render:l=>{const converted=convertedIds.has(l.id);return <div className="record-status"><select value={l.status} disabled={converted} onChange={e=>onStatusChange(l.id,e.target.value)} className="compact-select">{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select><StatusBadge status={converted?'converted':l.status}/></div>}},
    {key:'temperature',header:'Priority',render:l=><div className="priority-cell"><TempDot temperature={l.temperature}/><span>{l.temperature||'cold'}</span></div>},
    {key:'actions',header:'',className:'text-right',render:l=>{const converted=convertedIds.has(l.id);return <div className="row-actions"><button type="button" disabled={converted} onClick={()=>setConvertingLead(l)}>{converted?'Converted':'Convert'}</button><ConfirmAction label="Delete" confirmLabel="Delete permanently" message="This permanently deletes the lead. This cannot be undone." onConfirm={()=>onDelete(l.id)} disabled={!isAdmin}/></div>}}
  ]
  return <section className="page-space">
    <div className="page-header"><div><p className="crm-section-label">Prospects</p><h1 className="crm-page-heading">Leads</h1><p className="page-subtitle">Track prospects, qualify interest and move promising conversations forward.</p></div><Button onClick={()=>setAddOpen(true)}>+ Add lead</Button></div>
    <div className="lead-stats"><div><span>Total leads</span><strong>{total}</strong></div><div><span>New</span><strong>{stats.new}</strong></div><div><span>Qualified</span><strong>{stats.qualified}</strong></div><div><span>Hot</span><strong>{stats.hot}</strong></div></div>
    <div className="toolbar-card lead-toolbar"><div className="search-wrap"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search leads…" /></div><div className="filter-group"><span className="toolbar-label">Status</span><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select>{statusFilter&&<button type="button" onClick={()=>setStatusFilter('')}>Clear</button>}</div></div>
    {error&&<p role="alert" className="alert-error">{error}</p>}
    <DataTable columns={columns} rows={filtered} rowKey={l=>l.id} loading={loading} empty={statusFilter?`No ${statusFilter} leads.`:'No leads yet — add your first one.'}/>
    <Modal open={addOpen} onClose={()=>setAddOpen(false)} title="Add lead"><LeadForm onSave={onAdd} onCancel={()=>setAddOpen(false)}/></Modal>
    <Modal open={Boolean(convertingLead)} onClose={()=>setConvertingLead(null)} title="Convert lead">{convertingLead&&<ConvertLeadForm lead={convertingLead} onConvert={onConvert} onCancel={()=>setConvertingLead(null)}/>}</Modal>
  </section>
}
