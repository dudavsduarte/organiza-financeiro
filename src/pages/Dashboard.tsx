import { ArrowDownRight, ArrowUpRight, Plus, Scale, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Modal } from '../components/Modal'
import { StatCard } from '../components/StatCard'
import { TransactionForm } from '../components/TransactionForm'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'
import { brl, monthKey, shortDate } from '../lib/format'

export function Dashboard() {
  const { user } = useAuth(); const { transactions, budgets, goals } = useFinance(); const [open, setOpen] = useState(false)
  const month = monthKey()
  const current = transactions.filter(t => t.date.startsWith(month))
  const income = current.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = current.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
  const savingsRate = income ? ((income - expense) / income) * 100 : 0
  const chartData = useMemo(() => {
    const days: Record<string, { date: string; receitas: number; despesas: number }> = {}
    current.forEach(t => { const key = t.date.slice(8); days[key] ||= { date: key, receitas: 0, despesas: 0 }; days[key][t.type === 'income' ? 'receitas' : 'despesas'] += t.amount })
    return Object.values(days).sort((a, b) => Number(a.date) - Number(b.date))
  }, [transactions])
  const expensesByCategory = current.filter(t => t.type === 'expense').reduce<Record<string, number>>((a, t) => ({ ...a, [t.category]: (a[t.category] || 0) + t.amount }), {})
  const topCategories = Object.entries(expensesByCategory).sort((a,b) => b[1]-a[1]).slice(0,5)

  return <>
    <div className="page-head"><div><p className="eyebrow">Seu dinheiro, mais claro</p><h1>Olá, {user?.name.split(' ')[0]} 👋</h1><p>Acompanhe sua vida financeira e tome decisões melhores.</p></div><button className="btn primary" onClick={() => setOpen(true)}><Plus size={18}/>Nova transação</button></div>
    <section className="stats-grid">
      <StatCard label="Saldo total" value={brl.format(balance)} detail="Todas as contas" icon={Scale} tone="purple"/>
      <StatCard label="Receitas do mês" value={brl.format(income)} detail={`${current.filter(t=>t.type==='income').length} lançamentos`} icon={ArrowUpRight} tone="positive"/>
      <StatCard label="Despesas do mês" value={brl.format(expense)} detail={`${current.filter(t=>t.type==='expense').length} lançamentos`} icon={ArrowDownRight} tone="negative"/>
      <StatCard label="Taxa de economia" value={`${savingsRate.toFixed(1)}%`} detail={savingsRate >= 20 ? 'Ótimo resultado' : 'Meta sugerida: 20%'} icon={TrendingUp}/>
    </section>
    <section className="dashboard-grid">
      <article className="card chart-card"><div className="card-head"><div><h2>Fluxo do mês</h2><p>Receitas e despesas por dia</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="income" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.25}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient><linearGradient id="expense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.22}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis tickFormatter={v=>`${v/1000}k`}/><Tooltip formatter={(v: number)=>brl.format(v)}/><Area type="monotone" dataKey="receitas" stroke="#16a34a" fill="url(#income)" strokeWidth={2.5}/><Area type="monotone" dataKey="despesas" stroke="#ef4444" fill="url(#expense)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div></article>
      <article className="card"><div className="card-head"><div><h2>Maiores despesas</h2><p>Por categoria neste mês</p></div></div><div className="category-list">{topCategories.length ? topCategories.map(([cat,value]) => <div key={cat}><div className="category-row"><span>{cat}</span><strong>{brl.format(value)}</strong></div><div className="progress"><i style={{width:`${Math.min(100, expense ? value/expense*100 : 0)}%`}}/></div></div>) : <p className="muted">Nenhuma despesa neste mês.</p>}</div></article>
      <article className="card"><div className="card-head"><div><h2>Transações recentes</h2><p>Seus últimos movimentos</p></div><a href="/transacoes">Ver todas</a></div><div className="transaction-list">{transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(t=><div className="transaction-item" key={t.id}><div className={`tx-icon ${t.type}`}>{t.type==='income'?<ArrowUpRight/>:<ArrowDownRight/>}</div><div className="tx-main"><strong>{t.description}</strong><small>{t.category} • {shortDate(t.date)}</small></div><strong className={t.type}>{t.type==='income'?'+':'-'} {brl.format(t.amount)}</strong></div>)}</div></article>
      <article className="card"><div className="card-head"><div><h2>Metas financeiras</h2><p>Progresso dos seus objetivos</p></div><a href="/metas">Gerenciar</a></div><div className="goals-mini">{goals.slice(0,3).map(g=>{const pct=Math.min(100,g.current/g.target*100);return <div key={g.id}><div className="category-row"><span>{g.name}</span><strong>{pct.toFixed(0)}%</strong></div><div className="progress purple"><i style={{width:`${pct}%`}}/></div><small>{brl.format(g.current)} de {brl.format(g.target)}</small></div>})}</div><div className="budget-summary"><span>{budgets.length} orçamentos configurados</span><a href="/orcamentos">Revisar limites</a></div></article>
    </section>
    {open && <Modal title="Nova transação" onClose={()=>setOpen(false)}><TransactionForm onDone={()=>setOpen(false)}/></Modal>}
  </>
}
