import client from './client'
import mockDeals from '../mocks/deals.json'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
let mockData = JSON.parse(JSON.stringify(mockDeals))

export const listDealsForCompany = (companyId, { stage = '', showArchived = false } = {}) =>
  USE_MOCKS ? Promise.resolve({ data: mockData.data.filter(d => d.companyId === companyId && (!stage || d.stage === stage)), total: 0 }) : client.get('/deals', { params: { companyId, stage, all: true, ...(showArchived ? { showArchived: true } : {}) } }).then(r => r.data)

export const listDeals = ({ ownerId = '', all = true, stuckOnly = false, showArchived = false } = {}) =>
  USE_MOCKS ? Promise.resolve({ data: mockData.data, total: mockData.data.length }) : client.get('/deals', { params: { ownerId, all: true, ...(stuckOnly ? { stuckOnly: true } : {}), ...(showArchived ? { showArchived: true } : {}) } }).then(r => r.data)

export const getDeal = (id) => USE_MOCKS ? Promise.resolve(mockData.data.find(d => d.id === id)) : client.get(`/deals/${id}`).then(r => r.data)
export const createDeal = (payload) => USE_MOCKS ? Promise.resolve({ id: `mock-${Date.now()}`, stage: 'new', temperature: 'hot', ...payload }) : client.post('/deals', payload).then(r => r.data)
export const updateDeal = (id, payload) => USE_MOCKS ? Promise.resolve({ id, ...payload }) : client.put(`/deals/${id}`, payload).then(r => r.data)
export const updateDealStage = (id, stage) => USE_MOCKS ? Promise.resolve({ id, stage, temperature: 'hot' }) : client.patch(`/deals/${id}/stage`, { stage }).then(r => r.data)
export const reassignDeal = (id, ownerId) => client.patch(`/deals/${id}/reassign`, { ownerId }).then(r => r.data)
export const bulkReassignDeals = (dealIds, ownerId) => client.patch('/deals/bulk-reassign', { dealIds, ownerId }).then(r => r.data)
export const deleteDeal = (id) => client.delete(`/deals/${id}`).then(() => ({ id }))
export const getOverdueDeals = () => client.get('/deals/overdue').then(r => r.data)
export const getArchiveWarnings = () => client.get('/deals/archive-warnings').then(r => r.data)
export const restoreDeal = (id) => client.patch(`/deals/${id}/restore`).then(r => r.data)
export const runArchiveCheck = () => client.post('/admin/deals/run-archive-check').then(r => r.data)

export const downloadDealsCsv = async (params = {}) => {
  const response = await client.get('/export/deals.csv', { params, responseType: 'blob' })
  const disposition = response.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^";]+)"?/i)
  const filename = match?.[1] || `Pipeline_Report_${new Date().toISOString().slice(0, 10)}.csv`
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}
