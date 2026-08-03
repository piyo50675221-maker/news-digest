import { api } from './client'
import type {
  Account,
  AccountInput,
  BalanceSnapshot,
  CsvImportPreview,
  CsvImportResult,
  PortfolioHistory,
  PortfolioSummary,
  Scope,
  User,
} from './types'

export const authApi = {
  login: (username: string, password: string) => api.post<User>('/api/auth/login', { username, password }),
  logout: () => api.post<{ ok: boolean }>('/api/auth/logout'),
  me: () => api.get<User>('/api/auth/me'),
}

export const accountsApi = {
  list: (scope: Scope) => api.get<Account[]>(`/api/accounts?scope=${scope}`),
  create: (payload: AccountInput) => api.post<Account>('/api/accounts', payload),
  update: (id: number, payload: Partial<AccountInput>) => api.put<Account>(`/api/accounts/${id}`, payload),
  remove: (id: number) => api.del<void>(`/api/accounts/${id}`),
  listBalances: (id: number) => api.get<BalanceSnapshot[]>(`/api/accounts/${id}/balances`),
  addBalance: (id: number, snapshot_date: string, balance: number) =>
    api.post<BalanceSnapshot>(`/api/accounts/${id}/balances`, { snapshot_date, balance }),
  importPreview: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.postForm<CsvImportPreview>(`/api/accounts/${id}/balances/import/preview`, form)
  },
  importConfirm: (id: number, token: string, date_column: string, balance_column: string) =>
    api.post<CsvImportResult>(`/api/accounts/${id}/balances/import/confirm`, {
      token,
      date_column,
      balance_column,
    }),
}

export const portfolioApi = {
  summary: (scope: Scope) => api.get<PortfolioSummary>(`/api/portfolio?scope=${scope}`),
  history: (scope: Scope) => api.get<PortfolioHistory>(`/api/portfolio/history?scope=${scope}`),
}
