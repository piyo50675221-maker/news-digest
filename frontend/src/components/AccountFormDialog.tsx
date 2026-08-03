import { useState, type FormEvent } from 'react'
import { accountsApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Account, AccountType, AssetClass, Scope } from '../api/types'
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, ASSET_CLASSES, ASSET_CLASS_LABELS, DEFAULT_ASSET_CLASS_FOR_TYPE } from '../constants'

interface Props {
  scope: Scope
  account?: Account
  onClose: () => void
  onSaved: () => void
}

export function AccountFormDialog({ scope, account, onClose, onSaved }: Props) {
  const [accountType, setAccountType] = useState<AccountType>(account?.account_type ?? 'bank')
  const [assetClass, setAssetClass] = useState<AssetClass>(
    account?.asset_class ?? DEFAULT_ASSET_CLASS_FOR_TYPE['bank'],
  )
  const [institutionName, setInstitutionName] = useState(account?.institution_name ?? '')
  const [accountName, setAccountName] = useState(account?.account_name ?? '')
  const [currency, setCurrency] = useState(account?.currency ?? 'JPY')
  const [notes, setNotes] = useState(account?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function handleAccountTypeChange(value: AccountType) {
    setAccountType(value)
    if (!account) {
      setAssetClass(DEFAULT_ASSET_CLASS_FOR_TYPE[value])
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (account) {
        await accountsApi.update(account.id, {
          account_type: accountType,
          asset_class: assetClass,
          institution_name: institutionName,
          account_name: accountName,
          currency,
          notes: notes || null,
        })
      } else {
        await accountsApi.create({
          scope,
          account_type: accountType,
          asset_class: assetClass,
          institution_name: institutionName,
          account_name: accountName,
          currency,
          notes: notes || null,
        })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存に失敗しました。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900"
      >
        <h2 className="mb-4 text-lg font-semibold">
          {account ? '口座を編集' : `${scope === 'personal' ? '個人' : '家計'}の口座を追加`}
        </h2>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            種別
            <select
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={accountType}
              onChange={(e) => handleAccountTypeChange(e.target.value as AccountType)}
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACCOUNT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            資産クラス
            <select
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value as AssetClass)}
            >
              {ASSET_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {ASSET_CLASS_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mb-3 block text-sm">
          金融機関名
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            required
          />
        </label>

        <label className="mb-3 block text-sm">
          口座名
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
        </label>

        <label className="mb-3 block text-sm">
          通貨
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </label>

        <label className="mb-4 block text-sm">
          メモ
          <textarea
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={notes ?? ''}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </label>

        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  )
}
