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

export interface Insurance {
  id: number
  subject_user_id: number | null
  subject_display_name: string | null
  insurance_type: string
  company_name: string
  product_name: string | null
  policy_number: string | null
  insured_person: string | null
  beneficiary: string | null
  coverage_summary: string | null
  coverage_amount: number | null
  premium: number | null
  premium_cycle: string | null
  renewal_date: string | null
  contact_info: string | null
  notes: string | null
}

export interface InsuranceInput {
  subject_user_id?: number | null
  insurance_type: string
  company_name: string
  product_name?: string | null
  policy_number?: string | null
  insured_person?: string | null
  beneficiary?: string | null
  coverage_summary?: string | null
  coverage_amount?: number | null
  premium?: number | null
  premium_cycle?: string | null
  renewal_date?: string | null
  contact_info?: string | null
  notes?: string | null
}

export interface InheritanceItem {
  id: number
  subject_user_id: number | null
  subject_display_name: string | null
  account_id: number | null
  account_label: string | null
  title: string
  contact_info: string | null
  required_documents: string | null
  deadline_text: string | null
  deadline_date: string | null
  is_done: boolean
  notes: string | null
}

export interface InheritanceItemInput {
  subject_user_id?: number | null
  account_id?: number | null
  title: string
  contact_info?: string | null
  required_documents?: string | null
  deadline_text?: string | null
  deadline_date?: string | null
  is_done?: boolean
  notes?: string | null
}
