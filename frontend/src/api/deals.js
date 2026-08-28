import client from './client'
import mockDeals from '../mocks/deals.json'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

let mockData = JSON.parse(JSON.stringify(mockDeals))

export const listDealsForCompany = (companyId, { stage = '' } = {}) => {
  if (!USE_MOCKS) {
    return client.get('/deals', { params: { companyId, stage } }).then((r) => r.data)
  }
  const filtered = mockData.data.filter((d) => {
    if (d.companyId !== companyId) return false
    if (stage && d.stage !== stage) return false
    return true
  })
  return Promise.resolve({ data: filtered, total: filtered.length })
}

export const listDeals = ({ ownerId = '' } = {}) => {
  if (!USE_MOCKS) {
    return client.get('/deals', { params: { ownerId } }).then((r) => r.data)
  }
  const filtered = ownerId ? mockData.data.filter((d) => d.ownerId === ownerId) : mockData.data
  return Promise.resolve({ data: filtered, total: filtered.length })
}

// New — used by the Deal Detail page (SCRUM-10)
export const getDeal = (id) =>
  USE_MOCKS
    ? Promise.resolve(mockData.data.find((d) => d.id === id))
    : client.get(`/deals/${id}`).then((r) => r.data)

export const createDeal = (payload) => {
  if (!USE_MOCKS) return client.post('/deals', payload).then((r) => r.data)
  const created = { id: `mock-deal-${Date.now()}`, stage: 'new', ...payload }
  mockData.data.unshift(created)
  return Promise.resolve(created)
}

export const updateDeal = (id, { title, value }) => {
  if (!USE_MOCKS) return client.put(`/deals/${id}`, { title, value }).then((r) => r.data)
  mockData.data = mockData.data.map((d) => (d.id === id ? { ...d, title, value } : d))
  return Promise.resolve({ id, title, value })
}

export const updateDealStage = (id, stage) => {
  if (!USE_MOCKS) return client.patch(`/deals/${id}/stage`, { stage }).then((r) => r.data)
  mockData.data = mockData.data.map((d) => (d.id === id ? { ...d, stage } : d))
  return Promise.resolve({ id, stage })
}


export const reassignDeal = (id, ownerId) => {
  if (!USE_MOCKS) return client.patch(`/deals/${id}/reassign`, { ownerId }).then((r) => r.data)
  const deal = mockData.data.find((d) => d.id === id)
  if (!deal) return Promise.reject(new Error('Deal not found'))
  deal.ownerId = ownerId
  return Promise.resolve({ ...deal })
}

export const deleteDeal = (id) => {
  if (!USE_MOCKS) return client.delete(`/deals/${id}`).then(() => ({ id }))
  mockData.data = mockData.data.filter((d) => d.id !== id)
  return Promise.resolve({ id })
}
