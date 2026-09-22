import client from './client'
import mockUsers from '../mocks/users.json'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const listUsers = (page = 1, limit = 20) =>
  USE_MOCKS
    ? Promise.resolve(mockUsers)
    : client.get('/users', { params: { page, limit } }).then((r) => r.data)

export const changeUserRole = (id, role) =>
  USE_MOCKS
    ? Promise.resolve({ id, role })
    : client.patch(`/users/${id}/role`, { role }).then((r) => r.data)

export const deactivateUser = (id) =>
  USE_MOCKS
    ? Promise.resolve({ id })
    : client.delete(`/users/${id}`).then(() => ({ id }))

export const deleteUserPermanently = (id) =>
  USE_MOCKS
    ? Promise.resolve({ id })
    : client.delete(`/users/${id}/permanent`).then(() => ({ id }))

// New — admin-only. Does NOT log the admin in as this user; no token
// comes back, the admin's own session is untouched. Distinct from the
// public register flow, which is being removed.
export const createUser = (payload) =>
  USE_MOCKS
    ? Promise.resolve({ id: `mock-user-${Date.now()}`, ...payload })
    : client.post('/users', payload).then((r) => r.data)
