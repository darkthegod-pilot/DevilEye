import { FolderPlus, FileText, User, Search, CheckCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ACTIVITY_FEED } from '@/data/mockData'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/cn'

const EVENT_CONFIG = {
  case_opened: { icon: FolderPlus, color: 'text-accent', bg: 'bg-accent/10' },
  note_added: { icon: FileText, color: 'text-primary-hover', bg: 'bg-primary/10' },
  profile_added: { icon: User, color: 'text-warning', bg: 'bg-warning/10' },
  query_added: { icon: Search, color: 'text-text-secondary', bg: 'bg-bg-hover' },
  task_done: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  status_change: { icon: AlertTriangle, color: 'text-alert', bg: 'bg-alert/10' },
}

export function ActivityFeed() {
  const { getUserById } = useApp()

  const sorted = [...ACTIVITY_FEED].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Atividade Recente</h3>
        <span className="text-xs text-text-muted">Equipe</span>
      </div>
      <div className="space-y-3">
        {sorted.slice(0, 6).map((event, i) => {
          const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.note_added
          const Icon = config.icon
          const user = getUserById(event.authorId)
          return (
            <div key={event.id} className="flex items-start gap-3">
              <div className={cn('p-1.5 rounded-md shrink-0 mt-0.5', config.bg)}>
                <Icon size={12} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-text-primary truncate">{event.description}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 truncate">{event.caseTitle}</p>
                  </div>
                  <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0">
                    {format(new Date(event.timestamp), 'dd/MM', { locale: ptBR })}
                  </span>
                </div>
                {user && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[8px] text-accent font-semibold">
                      {user.initials}
                    </span>
                    <span className="text-[10px] text-text-muted">{user.name}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
