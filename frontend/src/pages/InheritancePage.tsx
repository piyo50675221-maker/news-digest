import { useCallback, useEffect, useState } from 'react'
import { accountsApi, inheritanceApi, usersApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Account, InheritanceItem, User } from '../api/types'
import { InheritanceItemFormDialog } from '../components/InheritanceItemFormDialog'

export function InheritancePage() {
  const [items, setItems] = useState<InheritanceItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<InheritanceItem | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([inheritanceApi.list(), usersApi.list(), accountsApi.listAll()])
      .then(([itemList, userList, accountList]) => {
        setItems(itemList)
        setUsers(userList)
        setAccounts(accountList)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : '読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(item: InheritanceItem) {
    if (!confirm(`「${item.title}」を削除しますか？`)) return
    try {
      await inheritanceApi.remove(item.id)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '削除に失敗しました。')
    }
  }

  async function toggleDone(item: InheritanceItem) {
    try {
      await inheritanceApi.update(item.id, { is_done: !item.is_done })
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '更新に失敗しました。')
    }
  }

  const groups = new Map<string, InheritanceItem[]>()
  for (const item of items) {
    const key = item.subject_display_name ?? '共通・未指定'
    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">相続関連の情報</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          ＋ 項目を追加
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        相続手続きの連絡先・必要書類・期限などをまとめておく場所です。特定の口座に紐付けることも、法的な期限など全体のチェックリストとして単独で登録することもできます。
      </p>

      {loading && <p className="text-gray-500">読み込み中...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!loading && items.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">まだ項目が登録されていません。「＋ 項目を追加」から登録してください。</p>
      )}

      {[...groups.entries()].map(([subjectName, subjectItems]) => (
        <section key={subjectName} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">{subjectName}</h2>
          <div className="space-y-2">
            {subjectItems.map((item) => (
              <div
                key={item.id}
                className={`rounded border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 ${
                  item.is_done ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {item.is_done && '✓ '}
                      {item.title}
                      {item.account_label && (
                        <span className="ml-2 text-xs font-normal text-gray-400">({item.account_label})</span>
                      )}
                    </p>
                    <div className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
                      {item.deadline_text && <p>期限: {item.deadline_text}</p>}
                      {item.deadline_date && <p>期限日: {item.deadline_date}</p>}
                      {item.required_documents && <p>必要書類: {item.required_documents}</p>}
                      {item.contact_info && <p>連絡先: {item.contact_info}</p>}
                      {item.notes && <p className="text-gray-400">{item.notes}</p>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2 text-sm">
                    <button
                      onClick={() => toggleDone(item)}
                      className="rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                    >
                      {item.is_done ? '未対応に戻す' : '対応済みにする'}
                    </button>
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
        <InheritanceItemFormDialog
          users={users}
          accounts={accounts}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}

      {editing && (
        <InheritanceItemFormDialog
          users={users}
          accounts={accounts}
          item={editing}
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
