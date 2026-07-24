import { useState, type FormEvent } from 'react'
import { useFinance } from '../context/FinanceContext'
import type { Transaction } from '../types'

export function TransactionForm({ initial, onDone }: { initial?: Transaction; onDone: () => void }) {
  const { categories, addTransaction, updateTransaction } = useFinance()
  const [type, setType] = useState<'income'|'expense'>(initial?.type || 'expense')
  const [description, setDescription] = useState(initial?.description || '')
  const [amount, setAmount] = useState(initial?.amount?.toString() || '')
  const [category, setCategory] = useState(initial?.category || 'Alimentação')
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10))
  const [account, setAccount] = useState(initial?.account || 'Conta principal')
  const [note, setNote] = useState(initial?.note || '')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    const item = { description, amount: Number(amount), type, category, date, account, note }
    if (initial) await updateTransaction(initial.id, item)
    else await addTransaction(item)
    setSaving(false); onDone()
  }

  return <form className="form-grid" onSubmit={submit}>
    <div className="segmented full"><button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>Despesa</button><button type="button" className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>Receita</button></div>
    <label className="full">Descrição<input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex.: Supermercado"/></label>
    <label>Valor<input required min="0.01" step="0.01" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00"/></label>
    <label>Data<input required type="date" value={date} onChange={e => setDate(e.target.value)}/></label>
    <label>Categoria<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label>Conta<select value={account} onChange={e => setAccount(e.target.value)}><option>Conta principal</option><option>Cartão de crédito</option><option>Dinheiro</option><option>Investimentos</option></select></label>
    <label className="full">Observação<textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Opcional"/></label>
    <div className="form-actions full"><button type="button" className="btn secondary" onClick={onDone}>Cancelar</button><button className="btn primary" disabled={saving}>{saving ? 'Salvando...' : initial ? 'Salvar alterações' : 'Adicionar lançamento'}</button></div>
  </form>
}
