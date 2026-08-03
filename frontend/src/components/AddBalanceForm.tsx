import { useState, type FormEvent } from 'react'
import { accountsApi } from '../api/endpoints'
import { ApiError } from '../api/client'

interface Props {
  accountId: number
  onSaved: () => void
  onCancel: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AddBalanceForm({ accountId, onSaved, onCancel }: Props) {
  const [date, setDate] = useState(today())
  const [balance, setBalance] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = Number(balance)
    if (Number.isNaN(value)) {
      setError('数値を入力してください。')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await accountsApi.addBalance(accountId, date, value)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存に失敗しました。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
        required
      />
      <input
        type="number"
        step="1"
        placeholder="残高"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        className="w-32 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
        required
      />
      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-indigo-600 px-2 py-1 text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        登録
      </button>
      <button type="button" onClick={onCancel} className="px-2 py-1 text-gray-500 dark:text-gray-400">
        キャンセル
      </button>
    </form>
  )
}
