import type { LucideIcon } from 'lucide-react'
export function StatCard({ label, value, detail, icon: Icon, tone = 'neutral' }: { label: string; value: string; detail?: string; icon: LucideIcon; tone?: 'positive'|'negative'|'neutral'|'purple' }) {
  return <article className={`stat-card ${tone}`}><div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div><div className="stat-icon"><Icon size={21}/></div></article>
}
