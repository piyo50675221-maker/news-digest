import { useState } from 'react'
import { accountsApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { CsvImportPreview } from '../api/types'

interface Props {
  accountId: number
  onClose: () => void
  onImported: () => void
}

export function CsvImportDialog({ accountId, onClose, onImported }: Props) {
  const [preview, setPreview] = useState<CsvImportPreview | null>(null)
  const [dateColumn, setDateColumn] = useState('')
  const [balanceColumn, setBalanceColumn] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFileChange(file: File) {
    setError(null)
    setBusy(true)
    try {
      const data = await accountsApi.importPreview(accountId, file)
      setPreview(data)
      setDateColumn(data.headers[0] ?? '')
      setBalanceColumn(data.headers[1] ?? data.headers[0] ?? '')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ファイルの読み込みに失敗しました。')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirm() {
    if (!preview) return
    setError(null)
    setBusy(true)
    try {
      const res = await accountsApi.importConfirm(accountId, preview.token, dateColumn, balanceColumn)
      setResult(`${res.imported}件追加、${res.updated}件更新、${res.skipped}件変更なし`)
      onImported()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'インポートに失敗しました。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">CSVインポート（口座残高）</h2>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          「日付」列と「残高」列を含むCSVファイルを選択してください（UTF-8 / Shift_JIS 対応）。
        </p>

        {!preview && (
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileChange(file)
            }}
            className="mb-4 block w-full text-sm"
          />
        )}

        {preview && !result && (
          <div className="mb-4">
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="text-sm">
                日付列
                <select
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
                  value={dateColumn}
                  onChange={(e) => setDateColumn(e.target.value)}
                >
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                残高列
                <select
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
                  value={balanceColumn}
                  onChange={(e) => setBalanceColumn(e.target.value)}
                >
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="max-h-40 overflow-auto rounded border border-gray-200 text-xs dark:border-gray-700">
              <table className="w-full">
                <thead>
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="border-b border-gray-200 px-2 py-1 text-left dark:border-gray-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample_rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {result && <p className="mb-3 text-sm text-green-600 dark:text-green-400">{result}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            閉じる
          </button>
          {preview && !result && (
            <button
              onClick={handleConfirm}
              disabled={busy || !dateColumn || !balanceColumn}
              className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              インポート実行
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
