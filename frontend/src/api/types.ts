export type Scope = 'personal' | 'household'
export type AccountType = 'bank' | 'securities' | 'pension' | 'crypto' | 'credit_card'
export type AssetClass = 'cash' | 'stock' | 'fund' | 'pension' | 'crypto' | 'liability'

export interface User {
  id: number
  username: string
  display_name: string
}

export interface Account {
  id: number
  scope: Scope
  owner_user_id: number | null
  account_type: AccountType
  asset_class: AssetClass
  institution_name: string
  account_name: string
  currency: string
  notes: string | null
  latest_balance: number | null
  latest_balance_date: string | null
}

export interface AccountInput {
  scope: Scope
  account_type: AccountType
  asset_class: AssetClass
  institution_name: string
  account_name: string
  currency: string
  notes?: string | null
}

export interface BalanceSnapshot {
  id: number
  snapshot_date: string
  balance: number
}

export interface CsvImportPreview {
  headers: string[]
  sample_rows: string[][]
  detected_encoding: string
  token: string
}

export interface CsvImportResult {
  imported: number
  updated: number
  skipped: number
}

export interface PortfolioBreakdownItem {
  key: string
  label: string
  total: number
}

export interface PortfolioAccountItem {
  account: Account
  balance: number
  balance_date: string | null
}

export interface PortfolioSummary {
  total_net_worth: number
  by_asset_class: PortfolioBreakdownItem[]
  by_account_type: PortfolioBreakdownItem[]
  accounts: PortfolioAccountItem[]
}

export interface NetWorthHistoryPoint {
  date: string
  total: number
}

export interface PortfolioHistory {
  points: NetWorthHistoryPoint[]
}
