import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCompanies, createCompany, updateCompany, deleteCompany } from '../../api/companies'
import { listContacts } from '../../api/contacts'
import { listDeals } from '../../api/deals'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../auth/roles'
import { friendlyError } from '../../lib/errors'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmAction from '../../components/ui/ConfirmAction'
import Button from '../../components/ui/Button'
import CompanyForm from './CompanyForm'

const LIMIT = 20

export default function CompaniesListPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.ADMIN
  const canSeeCreators = [ROLES.MANAGER, ROLES.LEADERSHIP, ROLES.ADMIN].includes(user?.role)

  const [companies, setCompanies] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [companyScope, setCompanyScope] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = add, object = edit

  const load = useCallback(async (targetPage, targetSearch, targetScope) => {
    setLoading(true)
    setError(null)
    try {
      if (targetScope !== 'related' || user?.role !== ROLES.REP) {
        const res = await listCompanies({ page: targetPage, limit: LIMIT, search: targetSearch })
        setCompanies(res.data)
        setTotal(typeof res.total === 'number' ? res.total : res.data.length)
        return
      }

      // The backend intentionally returns all companies to reps. Build the
      // related-company view from the rep's own contacts and deals instead
      // of relying on an unsupported scope=related backend parameter.
      const [companyRes, contactRes, dealRes] = await Promise.all([
        listCompanies({ limit: 0, search: targetSearch }),
        listContacts({ limit: 0 }),
        listDeals({ limit: 0 }),
      ])
      const relatedIds = new Set()
      ;(companyRes.data || []).forEach((c) => {
        if (String(c.createdBy || '') === String(user.id || '')) relatedIds.add(String(c.id))
      })
      ;(contactRes.data || []).forEach((c) => {
        if (c.companyId) relatedIds.add(String(c.companyId))
      })
      ;(dealRes.data || []).forEach((d) => {
        if (d.companyId) relatedIds.add(String(d.companyId))
      })

      const related = (companyRes.data || []).filter((c) => relatedIds.has(String(c.id)))
      const start = (targetPage - 1) * LIMIT
      setCompanies(related.slice(start, start + LIMIT))
      setTotal(related.length)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load(page, search, companyScope)
  }, [load, page, search, companyScope])

  const onSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    load(1, search, companyScope)
  }

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (company) => { setEditing(company); setModalOpen(true) }

  const onSave = async (payload) => {
    if (editing) {
      // AC2 — updates instantly, optimistic
      const previous = companies
      setCompanies(companies.map((c) => (c.id === editing.id ? { ...c, ...payload } : c)))
      try {
        await updateCompany(editing.id, payload)
      } catch (err) {
        setCompanies(previous)
        throw err
      }
    } else {
      // AC1
      const created = await createCompany(payload)
      setCompanies([created, ...companies])
      setTotal((t) => t + 1)
    }
    setModalOpen(false)
  }

  const onDelete = async (id) => {
    const previous = companies
    const previousTotal = total
    setCompanies(companies.filter((c) => c.id !== id))
    setTotal((t) => Math.max(0, t - 1))
    try {
      await deleteCompany(id)
    } catch (err) {
      setCompanies(previous)
      setTotal(previousTotal)
      setError(friendlyError(err))
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Company',
      render: (c) => {
        const initials = (c.name || 'C').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
        return (
          <Link to={`/companies/${c.id}`} className="company-row-main group">
            <span className="company-avatar">{initials}</span>
            <span className="min-w-0">
              <strong>{c.name}</strong>
              {!canSeeCreators && String(c.createdBy || '') === String(user?.id || '') && (
                <span className="record-owner-label">Created by you</span>
              )}
            </span>
          </Link>
        )
      },
    },
    {
      key: 'industry',
      header: 'Industry',
      render: (c) => <span className="company-industry">{c.industry || 'Not specified'}</span>,
    },
    ...(canSeeCreators ? [{
      key: 'createdBy',
      header: 'Created by',
      className: 'text-slate-500',
      render: (c) => <span className="record-owner-name">{c.createdByNameSnapshot || 'Unknown'}</span>,
    }] : []),
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="company-actions">
          <Link to={`/companies/${c.id}`} className="company-open">View</Link>
          <button
            type="button"
            onClick={() => openEdit(c)}
            className="company-edit"
          >
            Edit
          </button>
          {/* AC3/AC4 — delete is admin-only; the control itself is hidden for reps */}
          <ConfirmAction
            label="Delete"
            confirmLabel="Delete"
            message="This also removes its contacts and deals."
            onConfirm={() => onDelete(c.id)}
            disabled={!isAdmin}
          />
        </div>
      ),
    },
  ]

  return (
    <section className="page-space">
      <div className="page-header">
        <div><p className="crm-section-label">Customers</p><h1 className="crm-page-heading">Companies</h1><p className="page-subtitle">Manage the organizations connected to your sales pipeline.</p></div>
        <Button onClick={openAdd}>+ Add company</Button>
      </div>
      <div className="company-summary">
        <div><span>Organizations</span><strong>{total}</strong><small>in your workspace</small></div>
        <div className="company-summary-note"><span>Directory</span><p>Keep customer organizations easy to scan, open and manage.</p></div>
      </div>
      <div className="toolbar-card company-toolbar">
        <div className="search-wrap"><span>⌕</span><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by company name…" /></div>
        {user?.role === ROLES.REP && (
          <div className="filter-group">
            <button type="button" className={companyScope === 'all' ? 'active' : ''} onClick={() => { setCompanyScope('all'); setPage(1) }}>All companies</button>
            <button type="button" className={companyScope === 'related' ? 'active' : ''} onClick={() => { setCompanyScope('related'); setPage(1) }}>My / Related</button>
          </div>
        )}
        <div className="toolbar-meta"><span>{search ? `Results for “${search}”` : companyScope === 'related' ? 'My / related companies' : 'All companies'}</span></div>
      </div>
      {error && <p role="alert" className="alert-error">{error}</p>}
      <DataTable columns={columns} rows={companies} rowKey={(c) => c.id} loading={loading} empty={search ? `No companies match "${search}".` : 'No companies yet — add your first one.'} page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit company' : 'Add company'}><CompanyForm initial={editing} onSave={onSave} onCancel={() => setModalOpen(false)} /></Modal>
    </section>
  )
}
