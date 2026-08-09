import { useState, type FormEvent } from 'react'
import { inheritanceApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Account, InheritanceItem, User } from '../api/types'

interface Props {
  users: User[]
  accounts: Account[]
  item?: InheritanceItem
  defaultAccountId?: number | null
  onClose: () => void
  onSaved: () => void
}

export function InheritanceItemFormDialog({ users, accounts, item, defaultAccountId, onClose, onSaved }: Props) {
  const [subjectUserId, setSubjectUserId] = useState<string>(
    item?.subject_user_id != null ? String(item.subject_user_id) : '',
  )
  const [accountId, setAccountId] = useState<string>(
    item?.account_id != null ? String(item.account_id) : defaultAccountId != null ? String(defaultAccountId) : '',
  )
  const [title, setTitle] = useState(item?.title ?? '')
  const [contactInfo, setContactInfo] = useState(item?.contact_info ?? '')
  const [requiredDocuments, setRequiredDocuments] = useState(item?.required_documents ?? '')
  const [deadlineText, setDeadlineText] = useState(item?.deadline_text ?? '')
  const [deadlineDate, setDeadlineDate] = useState(item?.deadline_date ?? '')
  const [isDone, setIsDone] = useState(item?.is_done ?? false)
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const payload = {
      subject_user_id: subjectUserId ? Number(subjectUserId) : null,
      account_id: accountId ? Number(accountId) : null,
      title,
      contact_info: contactInfo || null,
      required_documents: requiredDocuments || null,
      deadline_text: deadlineText || null,
      deadline_date: deadlineDate || null,
      is_done: isDone,
      notes: notes || null,
    }
    try {
      if (item) {
        await inheritanceApi.update(item.id, payload)
      } else {
        await inheritanceApi.create(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存に失敗しました。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900"
      >
        <h2 className="mb-4 text-lg font-semibold">{item ? '相続項目を編集' : '相続項目を追加'}</h2>

        <label className="mb-3 block text-sm">
          タイトル
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 相続税の申告、楽天銀行の解約手続き"
            required
          />
        </label>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            対象者（誰の相続か）
            <select
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={subjectUserId}
              onChange={(e) => setSubjectUserId(e.target.value)}
            >
              <option value="">共通・未指定</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            関連する口座（任意）
            <select
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">口座に紐付けない</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.institution_name} / {a.account_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mb-3 block text-sm">
          連絡先（窓口・専門家など）
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="電話番号・担当窓口など"
          />
        </label>

        <label className="mb-3 block text-sm">
          必要書類
          <textarea
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={requiredDocuments}
            onChange={(e) => setRequiredDocuments(e.target.value)}
            rows={2}
            placeholder="例: 戸籍謄本、除籍謄本、相続関係説明図、印鑑証明書"
          />
        </label>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            期限（文章での説明）
            <input
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={deadlineText}
              onChange={(e) => setDeadlineText(e.target.value)}
              placeholder="例: 相続開始を知った日から10ヶ月以内"
            />
          </label>
          <label className="text-sm">
            期限日（任意）
            <input
              type="date"
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          </label>
        </div>

        <label className="mb-3 block text-sm">
          メモ
          <textarea
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </label>

        <label className="mb-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDone} onChange={(e) => setIsDone(e.target.checked)} />
          対応済み
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
