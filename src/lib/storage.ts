import type { Budget, Goal, RecurringBill, Transaction } from '../types'
import { monthKey, uid } from './format'

const today = new Date()
const iso = (offset: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const demoTransactions: Transaction[] = [
  { id: uid(), description: 'Salário', amount: 7800, type: 'income', category: 'Salário', date: iso(-18), account: 'Conta principal' },
  { id: uid(), description: 'Freelance de design', amount: 1200, type: 'income', category: 'Renda extra', date: iso(-6), account: 'Conta principal' },
  { id: uid(), description: 'Aluguel', amount: 2400, type: 'expense', category: 'Moradia', date: iso(-16), account: 'Conta principal' },
  { id: uid(), description: 'Supermercado', amount: 684.9, type: 'expense', category: 'Alimentação', date: iso(-10), account: 'Cartão de crédito' },
  { id: uid(), description: 'Academia', amount: 159.9, type: 'expense', category: 'Saúde', date: iso(-8), account: 'Cartão de crédito' },
  { id: uid(), description: 'Streaming', amount: 55.9, type: 'expense', category: 'Assinaturas', date: iso(-4), account: 'Cartão de crédito' },
  { id: uid(), description: 'Restaurante', amount: 186, type: 'expense', category: 'Lazer', date: iso(-2), account: 'Cartão de crédito' },
  { id: uid(), description: 'Transporte', amount: 92.4, type: 'expense', category: 'Transporte', date: iso(-1), account: 'Conta principal' }
]

export const demoBudgets: Budget[] = [
  { id: uid(), category: 'Alimentação', limit: 1200, month: monthKey() },
  { id: uid(), category: 'Lazer', limit: 600, month: monthKey() },
  { id: uid(), category: 'Transporte', limit: 500, month: monthKey() },
  { id: uid(), category: 'Saúde', limit: 450, month: monthKey() }
]

export const demoGoals: Goal[] = [
  { id: uid(), name: 'Reserva de emergência', target: 20000, current: 8200, deadline: `${today.getFullYear() + 1}-12-31`, icon: 'shield' },
  { id: uid(), name: 'Viagem de férias', target: 8500, current: 3100, deadline: `${today.getFullYear() + 1}-06-30`, icon: 'plane' }
]

export const demoRecurring: RecurringBill[] = [
  { id: uid(), description: 'Aluguel', amount: 2400, category: 'Moradia', dueDay: 5, type: 'expense', active: true },
  { id: uid(), description: 'Internet', amount: 129.9, category: 'Moradia', dueDay: 10, type: 'expense', active: true },
  { id: uid(), description: 'Academia', amount: 159.9, category: 'Saúde', dueDay: 12, type: 'expense', active: true }
]

export function load<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch { return fallback }
}

export function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}
