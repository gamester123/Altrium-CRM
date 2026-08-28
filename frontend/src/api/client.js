import axios from 'axios'

let authToken = null
let handlers = { unauthorized: null, forbidden: null }

export const setAuthToken = (token) => { authToken = token }
export const setErrorHandlers = (next) => { handlers = { ...handlers, ...next } }

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
})

client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`
  return config
})

const AUTH_ATTEMPT_PATHS = ['/auth/login', '/auth/admin-login', '/auth/register']

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthAttempt = AUTH_ATTEMPT_PATHS.some((path) => url.includes(path))

    if (status === 401 && !isAuthAttempt) handlers.unauthorized?.()
    if (status === 403 && !isAuthAttempt) handlers.forbidden?.()

    const message = error.response?.data?.error || 'Something went wrong. Try again.'
    const wrapped = new Error(message)
    wrapped.status = status
    return Promise.reject(wrapped)
  }
)

export default client
