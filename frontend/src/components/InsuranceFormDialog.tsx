import { useState, type FormEvent } from 'react'
import { insuranceApi } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Insurance, User } from '../api/types'
import { INSURANCE_TYPES } from '../constants'

interface Props {
  users: User[]
  insurance?: Insurance
  onClose: () => void
  onSaved: () => void
}

export function InsuranceFormDialog({ users, insurance, onClose, onSaved }: Props) {
  const [subjectUserId, setSubjectUserId] = useState<string>(
    insurance?.subject_user_id != null ? String(insurance.subject_user_id) : '',
  )
  const [insuranceType, setInsuranceType] = useState(insurance?.insurance_type ?? INSURANCE_TYPES[0])
  const [companyName, setCompanyName] = useState(insurance?.company_name ?? '')
  const [productName, setProductName] = useState(insurance?.product_name ?? '')
  const [policyNumber, setPolicyNumber] = useState(insurance?.policy_number ?? '')
  const [insuredPerson, setInsuredPerson] = useState(insurance?.insured_person ?? '')
  const [beneficiary, setBeneficiary] = useState(insurance?.beneficiary ?? '')
  const [coverageSummary, setCoverageSummary] = useState(insurance?.coverage_summary ?? '')
  const [coverageAmount, setCoverageAmount] = useState(
    insurance?.coverage_amount != null ? String(insurance.coverage_amount) : '',
  )
  const [premium, setPremium] = useState(insurance?.premium != null ? String(insurance.premium) : '')
  const [premiumCycle, setPremiumCycle] = useState(insurance?.premium_cycle ?? 'monthly')
  const [renewalDate, setRenewalDate] = useState(insurance?.renewal_date ?? '')
  const [contactInfo, setContactInfo] = useState(insurance?.contact_info ?? '')
  const [notes, setNotes] = useState(insurance?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const payload = {
      subject_user_id: subjectUserId ? Number(subjectUserId) : null,
      insurance_type: insuranceType,
      company_name: companyName,
      product_name: productName || null,
      policy_number: policyNumber || null,
      insured_person: insuredPerson || null,
      beneficiary: beneficiary || null,
      coverage_summary: coverageSummary || null,
      coverage_amount: coverageAmount ? Number(coverageAmount) : null,
      premium: premium ? Number(premium) : null,
      premium_cycle: premiumCycle || null,
      renewal_date: renewalDate || null,
      contact_info: contactInfo || null,
      notes: notes || null,
    }
    try {
      if (insurance) {
        await insuranceApi.update(insurance.id, payload)
      } else {
        await insuranceApi.create(payload)
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
        <h2 className="mb-4 text-lg font-semibold">{insurance ? '保険を編集' : '保険を追加'}</h2>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            対象者
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
            保険の種類
            <select
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={insuranceType}
              onChange={(e) => setInsuranceType(e.target.value)}
            >
              {INSURANCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            保険会社名
            <input
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            商品名
            <input
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </label>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            被保険者
            <input
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={insuredPerson}
              onChange={(e) => setInsuredPerson(e.target.value)}
            />
          </label>
          <label className="text-sm">
            受取人
            <input
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
            />
          </label>
        </div>

        <label className="mb-3 block text-sm">
          補償内容
          <textarea
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={coverageSummary}
            onChange={(e) => setCoverageSummary(e.target.value)}
            rows={2}
          />
        </label>

        <div className="mb-3 grid grid-cols-3 gap-3">
          <label className="text-sm">
            保障金額(円)
            <input
              type="number"
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
            />
          </label>
          <label className="text-sm">
            保険料(円)
            <input
              type="number"
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
            />
          </label>
          <label className="text-sm">
            支払周期
            <select
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={premiumCycle}
              onChange={(e) => setPremiumCycle(e.target.value)}
            >
              <option value="monthly">月払い</option>
              <option value="yearly">年払い</option>
              <option value="lump_sum">一括払い</option>
            </select>
          </label>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            証券番号
            <input
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
            />
          </label>
          <label className="text-sm">
            更新日・満期日
            <input
              type="date"
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
            />
          </label>
        </div>

        <label className="mb-3 block text-sm">
          連絡先
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="電話番号・窓口URLなど"
          />
        </label>

        <label className="mb-4 block text-sm">
          メモ
          <textarea
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            value={notes}
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
