import client from './client'
import mockLeads from '../mocks/leads.json'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

let mockData = JSON.parse(JSON.stringify(mockLeads))

export const listLeads = ({ status = '', ownerId = '' } = {}) => {
  if (!USE_MOCKS) {
    return client.get('/leads', { params: { status, ownerId } }).then((r) => r.data)
  }
  const filtered = mockData.data.filter((l) => {
    if (status && l.status !== status) return false
    if (ownerId && l.ownerId !== ownerId) return false
    return true
  })
  return Promise.resolve({ data: filtered, total: filtered.length })
}

export const createLead = (payload) => {
  if (!USE_MOCKS) return client.post('/leads', payload).then((r) => r.data)
  const created = {
    id: `mock-lead-${Date.now()}`,
    status: 'new',
    temperature: 'hot',
    ...payload,
  }
  mockData.data.unshift(created)
  return Promise.resolve(created)
}

// PUT /leads/:id only changes status — this is not a general edit. Only
// new/contacted/qualified/lost are offered here; 'converted' is set
// exclusively by convertLead() below, never picked manually — same
// pattern as stage_change being system-only on the activity timeline.
export const updateLeadStatus = (id, status) =>
  USE_MOCKS
    ? Promise.resolve({ id, status })
    : client.put(`/leads/${id}`, { status }).then((r) => r.data)

export const convertLead = (id, companyId) =>
  USE_MOCKS
    ? Promise.resolve({ contactId: `mock-contact-${Date.now()}`, dealId: `mock-deal-${Date.now()}` })
    : client.post(`/leads/${id}/convert`, { companyId }).then((r) => r.data)

// Admin-only, genuinely permanent — there is no soft-delete route for
// leads, unlike every other entity in this app. Confirm copy must say so.
export const deleteLeadPermanently = (id) =>
  USE_MOCKS
    ? Promise.resolve({ id })
    : client.delete(`/leads/${id}/permanent`).then(() => ({ id }))
