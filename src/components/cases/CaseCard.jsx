import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, User, ExternalLink, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useApp } from '@/context/AppContext'
import { StatusBadge, PriorityBadge, RiskBadge, Badge } from '@/components/ui/Badge'

export function CaseCard({ c, compact = false }) {
  const navigate = useNavigate()
  const { openSidePanel, getUserById } = useApp()
  const user = getUserById(c.assignedTo)
  const isCritical = c.risk === 'critical' && c.status === 'active'

  return (
    <div
      className={cn(
        'card card-hover cursor-pointer group transition-all duration-150',
        isCritical && 'border-alert/20 shadow-glow-alert/5',
        compact ? 'p-3' : 'p-4'
      )}
      onClick={() => navigate(`/cases/${c.id}`)}
    >
      {/* Top accent */}
      <div className={cn(
        'h-0.5 -mx-4 -mt-4 mb-3 rounded-t-lg',
        c.risk === 'critical' ? 'bg-alert/50' :
        c.risk === 'high' ? 'bg-warning/40' :
        c.priority === 'high' ? 'bg-primary/40' : 'bg-border-main'
      )} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="mono">{c.ref}</span>
            {isCritical && <AlertTriangle size={11} className="text-alert" />}
          </div>
          <h3 className={cn(
            'font-semibold text-text-primary leading-tight truncate group-hover:text-accent transition-colors',
            compact ? 'text-sm' : 'text-sm'
          )}>
            {c.title}
          </h3>
        </div>
        <button
          onClick={e => { e.stopPropagation(); openSidePanel('case', c) }}
          className="p-1.5 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent hover:bg-bg-hover transition-all"
        >
          <ExternalLink size={12} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <StatusBadge status={c.status} />
        <PriorityBadge priority={c.priority} />
        <RiskBadge risk={c.risk} />
      </div>

      {!compact && c.summary && (
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">{c.summary}</p>
      )}

      {/* Tags */}
      {!compact && c.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {c.tags.slice(0, 3).map(t => <Badge key={t} className="text-[10px] py-0">{t}</Badge>)}
          {c.tags.length > 3 && <Badge className="text-[10px] py-0">+{c.tags.length - 3}</Badge>}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[10px] text-text-muted">
        <div className="flex items-center gap-1.5">
          {user && (
            <>
              <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[8px] text-accent font-semibold">
                {user.initials}
              </div>
              <span>{user.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          <span>{format(new Date(c.updatedAt), 'dd/MM/yy', { locale: ptBR })}</span>
        </div>
      </div>
    </div>
  )
}
