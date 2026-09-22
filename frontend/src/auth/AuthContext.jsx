import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { setAuthToken } from '../api/client'
import * as authApi from '../api/auth'

const TOKEN_KEY = 'crm_token'
const ADMIN_TOKEN_KEY = 'crm_admin_token'
const AuthContext = createContext(null)

const clearStoredTokens = () => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  setAuthToken(null)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
    if (!stored) { setLoading(false); return }

    setAuthToken(stored)
    authApi.getMe()
      .then(setUser)
      .catch(() => clearStoredTokens())
      .finally(() => setLoading(false))
  }, [])

  const finishLogin = useCallback(async (token, tokenKey) => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    sessionStorage.setItem(tokenKey, token)
    setAuthToken(token)
    try {
      const me = await authApi.getMe()
      setUser(me)
      return me
    } catch (err) {
      clearStoredTokens()
      throw err
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { token } = await authApi.login(email, password)
    return finishLogin(token, TOKEN_KEY)
  }, [finishLogin])

  const loginAdmin = useCallback(async (email, password) => {
    const { token } = await authApi.adminLogin(email, password)
    const me = await finishLogin(token, ADMIN_TOKEN_KEY)
    const privilegedRoles = ['manager', 'leadership', 'admin']
    if (!privilegedRoles.includes(me.role)) {
      clearStoredTokens()
      setUser(null)
      const error = new Error('This account is not authorized for management access.')
      error.response = { data: { error: error.message }, status: 403 }
      throw error
    }
    return me
  }, [finishLogin])

  const register = useCallback(async (payload) => {
    await authApi.register(payload)
    return login(payload.email, payload.password)
  }, [login])

  const logout = useCallback(() => {
    clearStoredTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAdmin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
