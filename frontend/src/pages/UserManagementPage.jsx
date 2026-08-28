import { useCallback, useEffect, useState } from 'react'
import { listUsers, changeUserRole, deactivateUser, createUser } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roles'
import { friendlyError } from '../lib/errors'
import DataTable from '../components/ui/DataTable'
import RoleBadge from '../components/ui/RoleBadge'
import CreateUserForm from './admin/CreateUserForm'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const LIMIT = 20

export default function UserManagementPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const load = useCallback((targetPage) => {
    setLoading(true)
    setError(null)
    listUsers(targetPage, LIMIT)
      .then((res) => {
        setUsers(res.data)
        setTotal(typeof res.total === 'number' ? res.total : res.data.length)
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(page) }, [load, page])

  const onRoleChange = async (id, role) => {
    const previous = users
    setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)))
    setBusyId(id)
    setError(null)
    try {
      await changeUserRole(id, role)
    } catch (err) {
      setUsers(previous)
      setError(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const onCreateUser = async (payload) => {
    const created = await createUser(payload)
    setUsers([created, ...users])
    setTotal((t) => t + 1)
    setCreateModalOpen(false)
  }

  const onDeactivate = async (id) => {
    const previous = users
    const previousTotal = total
    setUsers(users.filter((u) => u.id !== id))
    setTotal((t) => Math.max(0, t - 1))
    setConfirmingId(null)
    setBusyId(id)
    setError(null)
    try {
      await deactivateUser(id)
    } catch (err) {
      setUsers(previous)
      setTotal(previousTotal)
      setError(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <div>
          <div className="font-medium text-ink">{u.name}</div>
          {u.id === me?.id && <span className="text-xs text-ink/40">You</span>}
        </div>
      ),
    },
    { key: 'email', header: 'Email', className: 'text-ink/60 font-mono text-xs' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => {
        const isMe = u.id === me?.id
        const isProtected = isMe || u.role === ROLES.ADMIN
        return (
          <div className="flex items-center gap-2">
            <select
              value={u.role}
              disabled={isProtected || busyId === u.id}
              onChange={(e) => onRoleChange(u.id, e.target.value)}
              className="border border-line rounded-md px-2 py-1 text-xs font-mono disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-signal/40"
            >
              {Object.values(ROLES).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <RoleBadge role={u.role} />
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Account',
      render: (u) => {
        const isMe = u.id === me?.id
        const isProtected = isMe || u.role === ROLES.ADMIN
        if (isProtected) return <span className="text-xs text-ink/30">—</span>
        if (confirmingId === u.id) {
          return (
            <div className="space-y-1">
              <p className="text-xs text-ink/60">Disables sign-in. Their records stay in the system.</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onDeactivate(u.id)} disabled={busyId === u.id} className="text-xs text-hot font-medium hover:underline disabled:opacity-40">Deactivate</button>
                <button type="button" onClick={() => setConfirmingId(null)} className="text-xs text-ink/50 hover:underline">Cancel</button>
              </div>
            </div>
          )
        }
        return <button type="button" onClick={() => setConfirmingId(u.id)} className="text-xs text-ink/50 hover:text-hot transition">Deactivate</button>
      },
    },
  ]

  return (
    <section className="page-space">
      <div className="page-header">
        <div>
          <p className="crm-section-label">Administration</p>
          <h1 className="crm-page-heading">User management</h1>
          <p className="page-subtitle">Manage access, roles and account status for your team.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>+ Create user</Button>
      </div>
      <div className="admin-summary">
        <div><span className="summary-label">Team members</span><strong>{total}</strong></div>
        <div><span className="summary-label">Your role</span><strong className="capitalize">{me?.role || '—'}</strong></div>
        <div className="summary-note">Role changes apply immediately.</div>
      </div>
      {error && <p role="alert" className="alert-error">{error}</p>}
      <DataTable columns={columns} rows={users} rowKey={(u) => u.id} loading={loading} empty="No users found." page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create user">
        <CreateUserForm onSave={onCreateUser} onCancel={() => setCreateModalOpen(false)} />
      </Modal>
    </section>
  )
}
