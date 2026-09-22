import client from './client'
import mockContacts from '../mocks/contacts.json'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

let mockData = JSON.parse(JSON.stringify(mockContacts))

export const listContactsForCompany = (companyId, { search = '' } = {}) => {
  if (!USE_MOCKS) {
    return client.get('/contacts', { params: { companyId, search } }).then((r) => r.data)
  }
  const term = search.trim().toLowerCase()
  const filtered = mockData.data.filter((c) => {
    if (c.companyId !== companyId) return false
    if (!term) return true
    return c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
  })
  return Promise.resolve({ data: filtered, total: filtered.length })
}

// New — used by the Contact Detail page (SCRUM-10)
export const getContact = (id) =>
  USE_MOCKS
    ? Promise.resolve(mockData.data.find((c) => c.id === id))
    : client.get(`/contacts/${id}`).then((r) => r.data)

export const createContact = (payload) => {
  if (!USE_MOCKS) return client.post('/contacts', payload).then((r) => r.data)
  const created = { id: `mock-contact-${Date.now()}`, ...payload }
  mockData.data.unshift(created)
  return Promise.resolve(created)
}

export const updateContact = (id, payload) => {
  if (!USE_MOCKS) return client.put(`/contacts/${id}`, payload).then((r) => r.data)
  mockData.data = mockData.data.map((c) => (c.id === id ? { ...c, ...payload } : c))
  return Promise.resolve({ id, ...payload })
}

export const deleteContact = (id) => {
  if (!USE_MOCKS) return client.delete(`/contacts/${id}`).then(() => ({ id }))
  mockData.data = mockData.data.filter((c) => c.id !== id)
  return Promise.resolve({ id })
}
