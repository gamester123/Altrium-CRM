import client from './client'
import mockCompanies from '../mocks/companies.json'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

let mockData = JSON.parse(JSON.stringify(mockCompanies))

export const listCompanies = (params = {}) => {
  if (!USE_MOCKS) {
    return client.get('/companies', { params }).then((r) => r.data)
  }
  const { search = '', page = 1, limit = 20, scope = '', userId = '' } = params
  const filtered = mockData.data.filter((c) => {
    if (!c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (scope === 'related' && userId && String(c.createdBy || '') !== String(userId)) return false
    return true
  })
  const start = (page - 1) * limit
  const rows = Number(limit) > 0 ? filtered.slice(start, start + limit) : filtered
  return Promise.resolve({
    data: rows,
    total: filtered.length,
  })
}

export const getCompany = (id) =>
  USE_MOCKS
    ? Promise.resolve(mockData.data.find((c) => c.id === id))
    : client.get(`/companies/${id}`).then((r) => r.data)

export const createCompany = (payload) => {
  if (!USE_MOCKS) return client.post('/companies', payload).then((r) => r.data)
  const created = { id: `mock-${Date.now()}`, ...payload }
  mockData.data.unshift(created)
  mockData.total += 1
  return Promise.resolve(created)
}

export const updateCompany = (id, payload) => {
  if (!USE_MOCKS) return client.put(`/companies/${id}`, payload).then((r) => r.data)
  mockData.data = mockData.data.map((c) => (c.id === id ? { ...c, ...payload } : c))
  return Promise.resolve({ id, ...payload })
}

export const deleteCompany = (id) => {
  if (!USE_MOCKS) return client.delete(`/companies/${id}`).then(() => ({ id }))
  mockData.data = mockData.data.filter((c) => c.id !== id)
  mockData.total -= 1
  return Promise.resolve({ id })
}
