import type { AccountType, AssetClass } from './api/types'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: '銀行口座',
  securities: '証券口座',
  pension: '年金',
  crypto: '暗号資産',
  credit_card: 'クレジットカード',
}

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  cash: '現金・預金',
  stock: '株式',
  fund: '投資信託',
  pension: '年金',
  crypto: '暗号資産',
  liability: '負債(クレカ利用額等)',
}

export const ACCOUNT_TYPES: AccountType[] = ['bank', 'securities', 'pension', 'crypto', 'credit_card']
export const ASSET_CLASSES: AssetClass[] = ['cash', 'stock', 'fund', 'pension', 'crypto', 'liability']

export const DEFAULT_ASSET_CLASS_FOR_TYPE: Record<AccountType, AssetClass> = {
  bank: 'cash',
  securities: 'stock',
  pension: 'pension',
  crypto: 'crypto',
  credit_card: 'liability',
}

export const CHART_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#8b5cf6',
]

export const INSURANCE_TYPES = ['生命保険', '医療保険', 'がん保険', '火災保険', '地震保険', '自動車保険', '学資保険', 'その他']

export const PREMIUM_CYCLE_LABELS: Record<string, string> = {
  monthly: '月払い',
  yearly: '年払い',
  lump_sum: '一括払い',
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(
    value,
  )
}
