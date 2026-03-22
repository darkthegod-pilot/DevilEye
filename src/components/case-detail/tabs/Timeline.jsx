import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  FolderPlus, UserPlus, Search, FileText, Paperclip, CheckSquare,
  AlertTriangle, RotateCcw, XCircle, Activity
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/cn'
import { EmptyState } from '@/components/ui/EmptyState'

const EVENT_CONFIG = {
  case_created:   { icon: FolderPlus, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', label: 'Caso Criado' },
  profile_added:  { icon: UserPlus, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Investigado' },
  query_added:    { icon: Search, color: 'text-text-secondary', bg: 'bg-bg-hover', border: 'border-border-main', label: 'Consulta' },
  note_added:     { icon: FileText, color: 'text-primary-hover', bg: 'bg-primary/10', border: 'border-primary/20', label: 'Nota' },
  attachment_added: { icon: Paperclip, color: 'text-text-muted', bg: 'bg-bg-surface', border: 'border-border-subtle', label: 'Anexo' },
  task_added:     { icon: CheckSquare, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Tarefa' },
  status_change:  { icon: AlertTriangle, color: 'text-alert', bg: 'bg-alert/10', border: 'border-alert/20', label: 'Status' },
  case_reopened:  { icon: RotateCcw, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Reabertura' },
  closure:        { icon: XCircle, color: 'text-text-muted', bg: 'bg-bg-surface', border: 'border-border-main', label: 'Encerramento' },
}

const FILTER_TYPES = [
  { id: 'all', label: 'Todos' },
  { id: 'case_created', label: 'Abertura' },
  { id: 'profile_added', label: 'Investigados' },
  { id: 'query_added', label: 'Consultas' },
  { id: 'note_added', label: 'Notas' },
  { id: 'status_change', label: 'Status' },
  { id: 'attachment_added', label: 'Anexos' },
]

export function Timeline({ caseId }) {
  const { timelineEvents, getUserById } = useApp()
  const [filter, setFilter] = useState('all')

  const events = timelineEvents[caseId] || []
  const sorted = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  const filtered = filter === 'all' ? sorted : sorted.filter(e => e.type === filter)

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Timeline do Caso</h2>
          <p className="text-xs text-text-muted mt-0.5">{filtered.length} evento{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {FILTER_TYPES.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all',
              filter === f.id
                ? 'bg-primary/20 text-accent border border-primary/30'
                : 'bg-bg-surface text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border-main'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Activity} title="Sem eventos registrados" description="Os eventos da investigação aparecerão aqui." />
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border-main" />

          <div className="space-y-4">
            {filtered.map((event, idx) => {
              const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.note_added
              const Icon = config.icon
              const user = getUserById(event.authorId)
              const isFirst = idx === 0

              return (
                <div key={event.id} className="flex gap-4">
                  {/* Dot */}
                  <div className={cn(
                    'relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0',
                    'border', config.bg, config.border,
                    isFirst && 'ring-2 ring-offset-2 ring-offset-bg-primary ring-accent/30'
                  )}>
                    <Icon size={14} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="card p-4 animate-fade-in">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div>
                          <span className="text-xs font-semibold text-text-primary">{event.title}</span>
                          <span className={cn('badge ml-2', config.bg, config.color, config.border, 'text-[9px] border')}>
                            {config.label}
                          </span>
                        </div>
                        <time className="text-[10px] text-text-muted whitespace-nowrap shrink-0">
                          {format(new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </time>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">{event.description}</p>
                      {user && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[8px] text-accent font-semibold">
                            {user.initials}
                          </div>
                          <span className="text-[10px] text-text-muted">{user.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
