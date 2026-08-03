import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { accountsApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Account, AccountType } from '../api/types'
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, formatCurrency } from '../constants'
import { AccountFormDialog } from '../components/AccountFormDialog'
import { AddBalanceForm } from '../components/AddBalanceForm'
import { CsvImportDialog } from '../components/CsvImportDialog'

export function AccountsPage() {
  const { scope } = useApp()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [balanceFormAccountId, setBalanceFormAccountId] = useState<number | null>(null)
  const [csvAccountId, setCsvAccountId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    accountsApi
      .list(scope)
      .then(setAccounts)
      .catch((err) => setError(err instanceof ApiError ? err.message : '読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [scope])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(account: Account) {
    if (!confirm(`「${account.institution_name} ${account.account_name}」を削除しますか？`)) return
    try {
      await accountsApi.remove(account.id)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '削除に失敗しました。')
    }
  }

  const grouped: Record<AccountType, Account[]> = ACCOUNT_TYPES.reduce(
    (acc, t) => ({ ...acc, [t]: accounts.filter((a) => a.account_type === t) }),
    {} as Record<AccountType, Account[]>,
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{scope === 'personal' ? '個人' : '家計'}の口座管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          ＋ 口座を追加
        </button>
      </div>

      {loading && <p className="text-gray-500">読み込み中...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {!loading && accounts.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          まだ口座が登録されていません。「＋ 口座を追加」から登録してください。
        </p>
      )}

      {ACCOUNT_TYPES.map((type) =>
        grouped[type].length > 0 ? (
          <section key={type} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              {ACCOUNT_TYPE_LABELS[type]}
            </h2>
            <div className="space-y-2">
              {grouped[type].map((account) => (
                <div
                  key={account.id}
                  className="rounded border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {account.institution_name} / {account.account_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {account.latest_balance !== null
                          ? `${formatCurrency(account.latest_balance)}（${account.latest_balance_date}時点）`
                          : '残高未登録'}
                      </p>
                      {account.notes && <p className="mt-1 text-xs text-gray-400">{account.notes}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <button
                        onClick={() => setBalanceFormAccountId(account.id)}
                        className="rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                      >
                        残高追加
                      </button>
                      <button
                        onClick={() => setCsvAccountId(account.id)}
                        className="rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                      >
                        CSV取込
                      </button>
                      <button
                        onClick={() => setEditingAccount(account)}
                        className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(account)}
                        className="rounded px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  {balanceFormAccountId === account.id && (
                    <div className="mt-3">
                      <AddBalanceForm
                        accountId={account.id}
                        onSaved={() => {
                          setBalanceFormAccountId(null)
                          load()
                        }}
                        onCancel={() => setBalanceFormAccountId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null,
      )}

      {showCreate && (
        <AccountFormDialog
          scope={scope}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}

      {editingAccount && (
        <AccountFormDialog
          scope={scope}
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSaved={() => {
            setEditingAccount(null)
            load()
          }}
        />
      )}

      {csvAccountId !== null && (
        <CsvImportDialog
          accountId={csvAccountId}
          onClose={() => setCsvAccountId(null)}
          onImported={load}
        />
      )}
    </div>
  )
}
