import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrix_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('agrix_token') || '')

  const login = useCallback((tokenVal, userData) => {
    localStorage.setItem('agrix_token', tokenVal)
    localStorage.setItem('agrix_user', JSON.stringify(userData))
    setToken(tokenVal)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('agrix_token')
    localStorage.removeItem('agrix_user')
    setToken('')
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
