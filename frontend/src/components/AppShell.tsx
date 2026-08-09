import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function AppShell() {
  const { user, scope, setScope, logout } = useApp()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded px-3 py-1.5 text-sm font-medium ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    }`

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">資産管理</span>
            <nav className="flex gap-1">
              <NavLink to="/portfolio" className={navLinkClass}>
                ポートフォリオ
              </NavLink>
              <NavLink to="/accounts" className={navLinkClass}>
                口座管理
              </NavLink>
              <NavLink to="/insurance" className={navLinkClass}>
                保険
              </NavLink>
              <NavLink to="/inheritance" className={navLinkClass}>
                相続
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-gray-300 p-0.5 text-sm dark:border-gray-700">
              <button
                onClick={() => setScope('personal')}
                className={`rounded-full px-3 py-1 ${
                  scope === 'personal' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                個人
              </button>
              <button
                onClick={() => setScope('household')}
                className={`rounded-full px-3 py-1 ${
                  scope === 'household' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                家計
              </button>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{user?.display_name}</span>
            <button
              onClick={handleLogout}
              className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
