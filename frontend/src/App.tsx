import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { AccountsPage } from './pages/AccountsPage'
import { PortfolioPage } from './pages/PortfolioPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useApp()
  if (loading) return <div className="flex min-h-screen items-center justify-center">読み込み中...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/" element={<Navigate to="/portfolio" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
