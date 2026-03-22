import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useApp } from '@/context/AppContext'
import { StatusBadge, PriorityBadge, RiskBadge } from '@/components/ui/Badge'

const COLUMNS = [
  { key: 'ref', label: 'Referência', sortable: true },
  { key: 'title', label: 'Título', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'priority', label: 'Prioridade', sortable: true },
  { key: 'risk', label: 'Risco', sortable: true },
  { key: 'assignedTo', label: 'Responsável', sortable: false },
  { key: 'updatedAt', label: 'Atualização', sortable: true },
  { key: 'actions', label: '', sortable: false },
]

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER = { active: 0, pending: 1, suspended: 2, closed: 3 }

export function CaseTable({ cases }) {
  const [sortKey, setSortKey] = useState('updatedAt')
  const [sortDir, setSortDir] = useState('desc')
  const navigate = useNavigate()
  const { getUserById, openSidePanel } = useApp()

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...cases].sort((a, b) => {
    let av, bv
    if (sortKey === 'priority') { av = PRIORITY_ORDER[a.priority] ?? 99; bv = PRIORITY_ORDER[b.priority] ?? 99 }
    else if (sortKey === 'risk') { av = RISK_ORDER[a.risk] ?? 99; bv = RISK_ORDER[b.risk] ?? 99 }
    else if (sortKey === 'status') { av = STATUS_ORDER[a.status] ?? 99; bv = STATUS_ORDER[b.status] ?? 99 }
    else if (sortKey === 'updatedAt' || sortKey === 'createdAt') {
      av = new Date(a[sortKey]); bv = new Date(b[sortKey])
    } else {
      av = (a[sortKey] || '').toLowerCase(); bv = (b[sortKey] || '').toLowerCase()
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-main">
            {COLUMNS.map(col => (
              <th key={col.key} className="text-left py-3 px-4 first:pl-5 last:pr-5">
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 text-xs font-semibold text-text-muted uppercase tracking-widest hover:text-text-secondary transition-colors"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ChevronDown size={12} className="opacity-30" />
                    )}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">{col.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(c => {
            const user = getUserById(c.assignedTo)
            return (
              <tr
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="border-b border-border-subtle hover:bg-bg-hover cursor-pointer transition-colors group"
              >
                <td className="py-3 px-4 pl-5">
                  <span className="mono">{c.ref}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-text-primary font-medium group-hover:text-accent transition-colors">{c.title}</span>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={c.status} />
                </td>
                <td className="py-3 px-4">
                  <PriorityBadge priority={c.priority} />
                </td>
                <td className="py-3 px-4">
                  <RiskBadge risk={c.risk} />
                </td>
                <td className="py-3 px-4">
                  {user && (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] text-accent font-semibold shrink-0">
                        {user.initials}
                      </div>
                      <span className="text-xs text-text-secondary">{user.name}</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-xs text-text-muted">
                  {format(new Date(c.updatedAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </td>
                <td className="py-3 px-4 pr-5">
                  <button
                    onClick={e => { e.stopPropagation(); openSidePanel('case', c) }}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent hover:bg-bg-surface transition-all"
                  >
                    <ExternalLink size={13} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
