import { useEffect, useState } from 'react'
import { inheritanceApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Account, InheritanceItem, User } from '../api/types'
import { InheritanceItemFormDialog } from './InheritanceItemFormDialog'

interface Props {
  account: Account
  accounts: Account[]
  users: User[]
}

export function AccountInheritancePanel({ account, accounts, users }: Props) {
  const [items, setItems] = useState<InheritanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  function load() {
    setLoading(true)
    inheritanceApi
      .list({ accountId: account.id })
      .then(setItems)
      .catch((err) => console.error(err instanceof ApiError ? err.message : err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id])

  return (
    <div className="mt-3 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium text-gray-600 dark:text-gray-300">相続メモ（連絡先・必要書類など）</span>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded px-2 py-0.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
        >
          ＋ 追加
        </button>
      </div>
      {loading && <p className="text-gray-400">読み込み中...</p>}
      {!loading && items.length === 0 && <p className="text-gray-400">未登録です。</p>}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="text-gray-600 dark:text-gray-300">
            ・{item.title}
            {item.contact_info && ` / 連絡先: ${item.contact_info}`}
            {item.required_documents && ` / 必要書類: ${item.required_documents}`}
          </li>
        ))}
      </ul>

      {showCreate && (
        <InheritanceItemFormDialog
          users={users}
          accounts={accounts}
          defaultAccountId={account.id}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}
    </div>
  )
}
