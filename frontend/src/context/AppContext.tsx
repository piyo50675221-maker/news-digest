import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Scope, User } from '../api/types'

interface AppContextValue {
  user: User | null
  loading: boolean
  scope: Scope
  setScope: (scope: Scope) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<Scope>('household')

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error(err)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const loggedInUser = await authApi.login(username, password)
    setUser(loggedInUser)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  return (
    <AppContext.Provider value={{ user, loading, scope, setScope, login, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
