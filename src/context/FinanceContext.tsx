import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Budget, Goal, RecurringBill, Transaction } from '../types'
import { demoBudgets, demoGoals, demoRecurring, demoTransactions, load, save } from '../lib/storage'
import { uid } from '../lib/format'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

interface FinanceValue {
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  recurring: RecurringBill[]
  categories: string[]
  addTransaction: (item: Omit<Transaction, 'id'>) => Promise<void>
  updateTransaction: (id: string, item: Partial<Transaction>) => Promise<void>
  removeTransaction: (id: string) => Promise<void>
  addBudget: (item: Omit<Budget, 'id'>) => Promise<void>
  removeBudget: (id: string) => Promise<void>
  addGoal: (item: Omit<Goal, 'id'>) => Promise<void>
  updateGoal: (id: string, item: Partial<Goal>) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  addRecurring: (item: Omit<RecurringBill, 'id'>) => Promise<void>
  updateRecurring: (id: string, item: Partial<RecurringBill>) => Promise<void>
  removeRecurring: (id: string) => Promise<void>
  resetDemo: () => void
}

const FinanceContext = createContext<FinanceValue | null>(null)
const keys = { tx: 'organiza_transactions', budgets: 'organiza_budgets', goals: 'organiza_goals', recurring: 'organiza_recurring' }
const defaultCategories = ['Salário', 'Renda extra', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Compras', 'Investimentos', 'Outros']

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user, demoMode } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>(() => load(keys.tx, demoTransactions))
  const [budgets, setBudgets] = useState<Budget[]>(() => load(keys.budgets, demoBudgets))
  const [goals, setGoals] = useState<Goal[]>(() => load(keys.goals, demoGoals))
  const [recurring, setRecurring] = useState<RecurringBill[]>(() => load(keys.recurring, demoRecurring))

  useEffect(() => {
    if (!user || demoMode || !supabase) return
    Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('budgets').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('recurring_bills').select('*')
    ]).then(([tx, b, g, r]) => {
      if (tx.data) setTransactions(tx.data)
      if (b.data) setBudgets(b.data)
      if (g.data) setGoals(g.data)
      if (r.data) setRecurring(r.data.map(x => ({ ...x, dueDay: x.due_day })))
    })
  }, [user, demoMode])

  useEffect(() => { if (demoMode) save(keys.tx, transactions) }, [transactions, demoMode])
  useEffect(() => { if (demoMode) save(keys.budgets, budgets) }, [budgets, demoMode])
  useEffect(() => { if (demoMode) save(keys.goals, goals) }, [goals, demoMode])
  useEffect(() => { if (demoMode) save(keys.recurring, recurring) }, [recurring, demoMode])

  const addTransaction = async (item: Omit<Transaction, 'id'>) => {
    const next = { ...item, id: uid(), user_id: user?.id }
    if (!demoMode && supabase) {
      const { data } = await supabase.from('transactions').insert({ ...item, user_id: user!.id }).select().single()
      if (data) setTransactions(p => [data, ...p])
    } else setTransactions(p => [next, ...p])
  }
  const updateTransaction = async (id: string, item: Partial<Transaction>) => {
    if (!demoMode && supabase) await supabase.from('transactions').update(item).eq('id', id)
    setTransactions(p => p.map(x => x.id === id ? { ...x, ...item } : x))
  }
  const removeTransaction = async (id: string) => {
    if (!demoMode && supabase) await supabase.from('transactions').delete().eq('id', id)
    setTransactions(p => p.filter(x => x.id !== id))
  }

  const addBudget = async (item: Omit<Budget, 'id'>) => {
    if (!demoMode && supabase && user) {
      const { data } = await supabase.from('budgets').insert({ ...item, user_id: user.id }).select().single()
      if (data) setBudgets(p => [...p, data])
    } else setBudgets(p => [...p, { ...item, id: uid() }])
  }
  const removeBudget = async (id: string) => {
    if (!demoMode && supabase) await supabase.from('budgets').delete().eq('id', id)
    setBudgets(p => p.filter(x => x.id !== id))
  }
  const addGoal = async (item: Omit<Goal, 'id'>) => {
    if (!demoMode && supabase && user) {
      const { data } = await supabase.from('goals').insert({ ...item, user_id: user.id }).select().single()
      if (data) setGoals(p => [...p, data])
    } else setGoals(p => [...p, { ...item, id: uid() }])
  }
  const updateGoal = async (id: string, item: Partial<Goal>) => {
    if (!demoMode && supabase) await supabase.from('goals').update(item).eq('id', id)
    setGoals(p => p.map(x => x.id === id ? { ...x, ...item } : x))
  }
  const removeGoal = async (id: string) => {
    if (!demoMode && supabase) await supabase.from('goals').delete().eq('id', id)
    setGoals(p => p.filter(x => x.id !== id))
  }
  const addRecurring = async (item: Omit<RecurringBill, 'id'>) => {
    if (!demoMode && supabase && user) {
      const { data } = await supabase.from('recurring_bills').insert({
        user_id: user.id,
        description: item.description,
        amount: item.amount,
        category: item.category,
        due_day: item.dueDay,
        type: item.type,
        active: item.active
      }).select().single()
      if (data) setRecurring(p => [...p, { ...data, dueDay: data.due_day }])
    } else setRecurring(p => [...p, { ...item, id: uid() }])
  }
  const updateRecurring = async (id: string, item: Partial<RecurringBill>) => {
    if (!demoMode && supabase) {
      const payload: Record<string, unknown> = { ...item }
      if (item.dueDay !== undefined) { payload.due_day = item.dueDay; delete payload.dueDay }
      await supabase.from('recurring_bills').update(payload).eq('id', id)
    }
    setRecurring(p => p.map(x => x.id === id ? { ...x, ...item } : x))
  }
  const removeRecurring = async (id: string) => {
    if (!demoMode && supabase) await supabase.from('recurring_bills').delete().eq('id', id)
    setRecurring(p => p.filter(x => x.id !== id))
  }
  const resetDemo = () => { setTransactions(demoTransactions); setBudgets(demoBudgets); setGoals(demoGoals); setRecurring(demoRecurring) }
  const categories = [...new Set([...defaultCategories, ...transactions.map(x => x.category)])]
  const value = useMemo(() => ({ transactions, budgets, goals, recurring, categories, addTransaction, updateTransaction, removeTransaction, addBudget, removeBudget, addGoal, updateGoal, removeGoal, addRecurring, updateRecurring, removeRecurring, resetDemo }), [transactions, budgets, goals, recurring])
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance deve ser usado dentro de FinanceProvider')
  return ctx
}
