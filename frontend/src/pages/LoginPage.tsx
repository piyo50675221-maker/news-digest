import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ApiError } from '../api/client'

export function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/portfolio')
    } catch (err) {
      setError(err instanceof ApiError ? 'ユーザー名またはパスワードが違います。' : '接続エラーが発生しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-6 text-xl font-semibold">資産管理アプリ ログイン</h1>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">ユーザー名</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">パスワード</label>
          <input
            type="password"
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          ログイン
        </button>
      </form>
    </div>
  )
}
