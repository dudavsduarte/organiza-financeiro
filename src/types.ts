export type TransactionType = 'income' | 'expense'
export type AccessStatus = 'active' | 'pending' | 'blocked'

export interface Transaction {
  id: string
  user_id?: string
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  account: string
  note?: string
  created_at?: string
}

export interface Budget {
  id: string
  category: string
  limit: number
  month: string
}

export interface Goal {
  id: string
  name: string
  target: number
  current: number
  deadline: string
  icon?: string
}

export interface RecurringBill {
  id: string
  description: string
  amount: number
  category: string
  dueDay: number
  type: TransactionType
  active: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  access_status: AccessStatus
  plan: string
  access_until?: string | null
}
