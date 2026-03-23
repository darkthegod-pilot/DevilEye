import { AlertTriangle, Clock, CheckSquare, TrendingUp, Users, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useApp } from '@/context/AppContext'
import { StatusBadge, PriorityBadge, RiskBadge, Badge } from '@/components/ui/Badge'

export function Overview({ caseId, c }) {
  const { notes, tasks, timelineEvents, profiles } = useApp()
  const caseNotes = notes[caseId] || []
  const caseTasks = tasks[caseId] || []
  const caseEvents = timelineEvents[caseId] || []
  const caseProfiles = profiles[caseId] || []

  const pendingTasks = caseTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const pinnedNotes = caseNotes.filter(n => n.pinned)
  const recentEvents = [...caseEvents].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5)
  const primaryProfile = caseProfiles.find(p => p.classification === 'primary')

  const user = c.assignedTo

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Resumo Executivo</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{c.summary || 'Nenhum resumo disponível.'}</p>
        <div className="mt-4 pt-3 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="section-title mb-1">Status</div>
            <StatusBadge status={c.status} />
          </div>
          <div>
            <div className="section-title mb-1">Prioridade</div>
            <PriorityBadge priority={c.priority} />
          </div>
          <div>
            <div className="section-title mb-1">Risco</div>
            <RiskBadge risk={c.risk} />
          </div>
          <div>
            <div className="section-title mb-1">Responsável</div>
            {user && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] text-accent font-semibold">
                  {user.initials}
                </div>
                <span className="text-xs text-text-secondary">{user.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Primary target */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Alvo Principal</h3>
          </div>
          {primaryProfile ? (
            <div>
              <p className="text-sm font-semibold text-text-primary">{primaryProfile.name}</p>
              {primaryProfile.aliases?.length > 0 && (
                <p className="text-xs text-text-muted mt-0.5">aka: {primaryProfile.aliases.join(', ')}</p>
              )}
              {primaryProfile.classification && (
                <Badge className="mt-2" variant="alert">Alvo Principal</Badge>
              )}
              {primaryProfile.notes && (
                <p className="text-xs text-text-secondary mt-2 leading-relaxed line-clamp-3">{primaryProfile.notes}</p>
              )}
              <div className="mt-2 text-xs text-text-muted">
                {caseProfiles.length} investigado{caseProfiles.length !== 1 ? 's' : ''} no total
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Nenhum alvo cadastrado ainda.</p>
          )}
        </div>

        {/* Pending tasks */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare size={14} className="text-warning" />
            <h3 className="text-sm font-semibold text-text-primary">Pendências</h3>
            {pendingTasks.length > 0 && (
              <span className="ml-auto badge bg-warning/10 text-warning border border-warning/20">{pendingTasks.length}</span>
            )}
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-text-muted">Sem pendências abertas.</p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map(task => (
                <div key={task.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                  <p className="text-xs text-text-secondary leading-snug">{task.title}</p>
                </div>
              ))}
              {pendingTasks.length > 4 && (
                <p className="text-xs text-text-muted">+{pendingTasks.length - 4} mais</p>
              )}
            </div>
          )}
        </div>

        {/* Recent movements */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-primary-hover" />
            <h3 className="text-sm font-semibold text-text-primary">Últimas Movimentações</h3>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-text-muted">Sem movimentações registradas.</p>
          ) : (
            <div className="space-y-2">
              {recentEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-text-secondary leading-snug">{ev.title}</p>
                    <p className="text-[10px] text-text-muted">{format(new Date(ev.timestamp), 'dd/MM/yy', { locale: ptBR })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pinned notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Notas Fixadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedNotes.map(note => (
              <div key={note.id} className="card p-4 border-l-2 border-l-accent">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-accent">{note.title}</span>
                  <Badge>{note.type}</Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {c.tags?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Classificação</h3>
          <div className="flex flex-wrap gap-2">
            {c.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
          </div>
        </div>
      )}
    </div>
  )
}
