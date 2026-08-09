import { useCallback, useEffect, useState } from 'react'
import { insuranceApi, usersApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Insurance, User } from '../api/types'
import { PREMIUM_CYCLE_LABELS, formatCurrency } from '../constants'
import { InsuranceFormDialog } from '../components/InsuranceFormDialog'

export function InsurancePage() {
  const [items, setItems] = useState<Insurance[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Insurance | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([insuranceApi.list(), usersApi.list()])
      .then(([insuranceList, userList]) => {
        setItems(insuranceList)
        setUsers(userList)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : '読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(item: Insurance) {
    if (!confirm(`「${item.company_name} ${item.product_name ?? ''}」を削除しますか？`)) return
    try {
      await insuranceApi.remove(item.id)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '削除に失敗しました。')
    }
  }

  const groups = new Map<string, Insurance[]>()
  for (const item of items) {
    const key = item.subject_display_name ?? '共通・未指定'
    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">保険</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          ＋ 保険を追加
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        ここでの内容は資産の合計金額（純資産）には含まれません。参考情報として管理します。
      </p>

      {loading && <p className="text-gray-500">読み込み中...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!loading && items.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">まだ保険が登録されていません。「＋ 保険を追加」から登録してください。</p>
      )}

      {[...groups.entries()].map(([subjectName, subjectItems]) => (
        <section key={subjectName} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">{subjectName}</h2>
          <div className="space-y-2">
            {subjectItems.map((item) => (
              <div
                key={item.id}
                className="rounded border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {item.insurance_type} — {item.company_name}
                      {item.product_name && ` (${item.product_name})`}
                    </p>
                    <div className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
                      {(item.insured_person || item.beneficiary) && (
                        <p>
                          {item.insured_person && `被保険者: ${item.insured_person}`}
                          {item.insured_person && item.beneficiary && ' / '}
                          {item.beneficiary && `受取人: ${item.beneficiary}`}
                        </p>
                      )}
                      {item.coverage_summary && <p>補償: {item.coverage_summary}</p>}
                      {item.coverage_amount != null && <p>保障金額: {formatCurrency(item.coverage_amount)}</p>}
                      {item.premium != null && (
                        <p>
                          保険料: {formatCurrency(item.premium)}
                          {item.premium_cycle && `（${PREMIUM_CYCLE_LABELS[item.premium_cycle] ?? item.premium_cycle}）`}
                        </p>
                      )}
                      {item.renewal_date && <p>更新日・満期日: {item.renewal_date}</p>}
                      {item.policy_number && <p>証券番号: {item.policy_number}</p>}
                      {item.contact_info && <p>連絡先: {item.contact_info}</p>}
                      {item.notes && <p className="text-gray-400">{item.notes}</p>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2 text-sm">
                    <button
                      onClick={() => setEditing(item)}
                      className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="rounded px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {showCreate && (
        <InsuranceFormDialog
          users={users}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}

      {editing && (
        <InsuranceFormDialog
          users={users}
          insurance={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}
