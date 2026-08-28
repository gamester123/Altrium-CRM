import client from './client'
import mockActivities from '../mocks/activities.json'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// NOTE: as of the last backend status report, there is no Activity model
// and no activity endpoints on the server at all — unlike every other
// module so far, there's nothing to fall back to except mocks right now.
// The `client.*` calls below are written to the contract this ticket
// specifies, ready for the day the endpoint exists.

let mockData = JSON.parse(JSON.stringify(mockActivities))

// AC1, AC2, AC3, AC6 — one call, filtered by whichever id is passed
export const listActivities = ({ dealId, contactId } = {}) => {
  if (!USE_MOCKS) {
    return client.get('/activities', { params: { dealId, contactId } }).then((r) => r.data)
  }
  const filtered = mockData.data.filter((a) => {
    if (dealId) return a.dealId === dealId
    if (contactId) return a.contactId === contactId
    return false
  })
  // AC3 — newest first
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.loggedAt) - new Date(a.loggedAt)
  )
  return Promise.resolve({ data: sorted })
}

// AC1, AC2, AC4 — validation (notes required) happens in the form before
// this is ever called; this function assumes valid input.
export const createActivity = (payload) => {
  if (!USE_MOCKS) return client.post('/activities', payload).then((r) => r.data)
  const created = {
    id: `mock-activity-${Date.now()}`,
    loggedAt: new Date().toISOString(),
    ...payload,
  }
  mockData.data.unshift(created)
  return Promise.resolve(created)
}
