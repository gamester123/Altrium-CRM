import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listContactsForCompany,
  createContact,
  updateContact,
  deleteContact,
} from '../../api/contacts'
import { friendlyError } from '../../lib/errors'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmAction from '../../components/ui/ConfirmAction'
import Button from '../../components/ui/Button'
import ContactForm from './ContactForm'

export default function ContactsSection({ companyId }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback((term) => {
    setLoading(true)
    setError(null)
    listContactsForCompany(companyId, { search: term })
      .then((res) => setContacts(res.data))
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { load(appliedSearch) }, [load, appliedSearch])

  const onSearchSubmit = (e) => {
    e.preventDefault()
    setAppliedSearch(search)
  }

  const onClear = () => {
    setSearch('')
    setAppliedSearch('')
  }

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (contact) => { setEditing(contact); setModalOpen(true) }

  const onSave = async (payload) => {
    if (editing) {
      const previous = contacts
      setContacts(contacts.map((c) => (c.id === editing.id ? { ...c, ...payload } : c)))
      try {
        await updateContact(editing.id, payload)
      } catch (err) {
        setContacts(previous)
        throw err
      }
    } else {
      const created = await createContact(payload)
      setContacts([{ ...payload, ...created }, ...contacts])
    }
    setModalOpen(false)
  }

  const onDelete = async (id) => {
    const previous = contacts
    setContacts(contacts.filter((c) => c.id !== id))
    try {
      await deleteContact(id)
    } catch (err) {
      setContacts(previous)
      setError(friendlyError(err))
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <Link to={`/contacts/${c.id}`} className="font-medium text-ink hover:text-signal transition">
          {c.name}
        </Link>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Job title',
      className: 'text-ink/60',
      render: (c) => c.jobTitle || '—',
    },
    { key: 'email', header: 'Email', className: 'text-ink/60 font-mono text-xs' },
    {
      key: 'phone',
      header: 'Phone',
      className: 'text-ink/60',
      render: (c) => c.phone || '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => openEdit(c)}
            className="text-xs text-ink/50 hover:text-ink transition"
          >
            Edit
          </button>
          <ConfirmAction label="Delete" confirmLabel="Delete" onConfirm={() => onDelete(c.id)} />
        </div>
      ),
    },
  ]

  return (
    <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Contacts</h2>
        <Button size="sm" onClick={openAdd}>Add contact</Button>
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={onSearchSubmit} className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full max-w-xs border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
          />
        </form>
        {appliedSearch && (
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
        rows={contacts}
        rowKey={(c) => c.id}
        loading={loading}
        empty={appliedSearch ? `No contacts match "${appliedSearch}".` : 'No contacts yet for this company.'}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit contact' : 'Add contact'}
      >
        <ContactForm
          initial={editing}
          companyId={companyId}
          onSave={onSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
