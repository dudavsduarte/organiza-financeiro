import { BarChart3, CalendarClock, ChevronLeft, ChevronRight, CreditCard, Goal, LayoutDashboard, LogOut, Menu, PieChart, ReceiptText, Settings, WalletCards, X } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/dashboard', 'Visão geral', LayoutDashboard], ['/transacoes', 'Transações', ReceiptText], ['/orcamentos', 'Orçamentos', WalletCards],
  ['/metas', 'Metas', Goal], ['/recorrentes', 'Recorrentes', CalendarClock], ['/relatorios', 'Relatórios', PieChart], ['/configuracoes', 'Configurações', Settings]
] as const

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const { user, signOut } = useAuth()
  return <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
    {mobile && <div className="mobile-overlay" onClick={() => setMobile(false)}/>} 
    <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><BarChart3/></div><span>organiza.</span><button className="mobile-close" onClick={() => setMobile(false)}><X/></button></div>
      <nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setMobile(false)}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom">
        <div className="mini-card"><CreditCard size={18}/><div><strong>{user?.plan === 'premium' ? 'Plano Premium' : 'Plano gratuito'}</strong><small>Acesso ativo</small></div></div>
        <button className="nav-button" onClick={signOut}><LogOut size={19}/><span>Sair</span></button>
      </div>
      <button className="collapse-btn" onClick={() => setCollapsed(x => !x)}>{collapsed ? <ChevronRight/> : <ChevronLeft/>}</button>
    </aside>
    <main>
      <header className="topbar"><button className="menu-btn" onClick={() => setMobile(true)}><Menu/></button><div className="topbar-spacer"/><div className="user-chip"><div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div><div><strong>{user?.name}</strong><small>{user?.email}</small></div></div></header>
      <div className="page-container"><Outlet/></div>
    </main>
  </div>
}
