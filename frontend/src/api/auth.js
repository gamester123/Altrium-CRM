import client from './client'

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data)

// The backend developer should expose this as a privileged-only endpoint.
// Keeping it separate prevents the frontend from treating the general login
// endpoint as an admin authentication flow.
export const adminLogin = (email, password) =>
  client.post('/auth/admin-login', { email, password }).then((r) => r.data)

export const register = (payload) =>
  client.post('/auth/register', payload).then((r) => r.data)

export const getMe = () => client.get('/auth/me').then((r) => r.data)
