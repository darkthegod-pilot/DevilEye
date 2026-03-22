import { CaseCard } from './CaseCard'
import { cn } from '@/lib/cn'

const COLUMNS = [
  { id: 'active', label: 'Em Andamento', accentClass: 'border-t-accent', countClass: 'text-accent' },
  { id: 'pending', label: 'Pendente', accentClass: 'border-t-warning', countClass: 'text-warning' },
  { id: 'suspended', label: 'Suspenso', accentClass: 'border-t-text-muted', countClass: 'text-text-muted' },
  { id: 'closed', label: 'Encerrado', accentClass: 'border-t-success', countClass: 'text-success' },
]

export function CaseKanban({ cases }) {
  return (
    <div className="grid grid-cols-4 gap-4 h-full min-h-[60vh]">
      {COLUMNS.map(col => {
        const colCases = cases.filter(c => c.status === col.id)
        return (
          <div key={col.id} className="flex flex-col gap-3">
            {/* Column header */}
            <div className={cn(
              'bg-bg-surface border border-border-main rounded-lg px-4 py-3',
              'border-t-2', col.accentClass
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{col.label}</span>
                <span className={cn('text-sm font-bold', col.countClass)}>{colCases.length}</span>
              </div>
            </div>
            {/* Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto pb-2">
              {colCases.map(c => (
                <CaseCard key={c.id} c={c} />
              ))}
              {colCases.length === 0 && (
                <div className="flex items-center justify-center h-24 bg-bg-surface/50 border border-dashed border-border-main rounded-lg">
                  <span className="text-xs text-text-muted">Sem casos</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
