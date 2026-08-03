import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { portfolioApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { NetWorthHistoryPoint, PortfolioSummary } from '../api/types'
import { ACCOUNT_TYPE_LABELS, CHART_COLORS, formatCurrency } from '../constants'

export function PortfolioPage() {
  const { scope } = useApp()
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [history, setHistory] = useState<NetWorthHistoryPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([portfolioApi.summary(scope), portfolioApi.history(scope)])
      .then(([summaryData, historyData]) => {
        setSummary(summaryData)
        setHistory(historyData.points)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : '読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [scope])

  if (loading) return <p className="text-gray-500">読み込み中...</p>
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!summary) return null

  const pieData = summary.by_asset_class.filter((item) => item.total !== 0)

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{scope === 'personal' ? '個人' : '家計'}の資産ポートフォリオ</h1>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">純資産合計</p>
        <p className="text-3xl font-bold">{formatCurrency(summary.total_net_worth)}</p>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">資産クラス別内訳</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400">データがありません。</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">純資産推移</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">残高データがありません。</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} width={90} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="total" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">口座別内訳</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th className="py-2">口座種別</th>
              <th className="py-2">金融機関 / 口座名</th>
              <th className="py-2 text-right">評価額</th>
              <th className="py-2 text-right">基準日</th>
            </tr>
          </thead>
          <tbody>
            {summary.accounts.map((item) => (
              <tr key={item.account.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2">{ACCOUNT_TYPE_LABELS[item.account.account_type]}</td>
                <td className="py-2">
                  {item.account.institution_name} / {item.account.account_name}
                </td>
                <td className="py-2 text-right">{formatCurrency(item.balance)}</td>
                <td className="py-2 text-right text-gray-400">{item.balance_date ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
