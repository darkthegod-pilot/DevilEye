import { FolderOpen, Activity, AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useApp } from '@/context/AppContext'
import { StatCard } from './StatCard'
import { RiskDistribution } from './RiskDistribution'
import { ActivityFeed } from './ActivityFeed'
import { StatusBadge, PriorityBadge, RiskBadge } from '@/components/ui/Badge'

export function Dashboard() {
  const { cases, tasks, openSidePanel } = useApp()
  const navigate = useNavigate()

  const activeCases = cases.filter(c => c.status === 'active').length
  const pendingCases = cases.filter(c => c.status === 'pending').length
  const closedCases = cases.filter(c => c.status === 'closed').length
  const criticalAlerts = cases.filter(c => c.risk === 'critical' && c.status === 'active').length

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)

  const allTasks = Object.values(tasks).flat()
  const pendingTasks = allTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').slice(0, 5)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">Dashboard Operacional</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Critical alert banner */}
      {criticalAlerts > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-alert/5 border border-alert/20 rounded-lg">
          <AlertTriangle size={16} className="text-alert shrink-0" />
          <p className="text-sm text-text-primary">
            <span className="font-semibold text-alert">{criticalAlerts}</span> operação{criticalAlerts > 1 ? 'ões' : ''} com nível de risco crítico ativa{criticalAlerts > 1 ? 's' : ''} requer{criticalAlerts === 1 ? '' : 'em'} atenção imediata.
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          label="Casos Abertos"
          value={activeCases}
          accentColor="text-accent"
          sub={`${pendingCases} aguardando ação`}
        />
        <StatCard
          icon={Activity}
          label="Em Andamento"
          value={activeCases}
          accentColor="text-primary-hover"
          sub="Investigações ativas"
        />
        <StatCard
          icon={AlertTriangle}
          label="Alertas Críticos"
          value={criticalAlerts}
          accentColor="text-alert"
          sub="Risco nível crítico"
        />
        <StatCard
          icon={CheckCircle}
          label="Encerrados"
          value={closedCases}
          accentColor="text-success"
          sub="Total de casos concluídos"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskDistribution />
        <ActivityFeed />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent cases */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Casos Recentes</h3>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-2">
            {recentCases.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="w-full flex items-center gap-3 p-3 bg-bg-surface hover:bg-bg-hover rounded-lg border border-border-subtle hover:border-border-main transition-all text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="mono">{c.ref}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm text-text-primary font-medium truncate">{c.title}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <RiskBadge risk={c.risk} />
                  <span className="text-[10px] text-text-muted">
                    {format(new Date(c.updatedAt), 'dd/MM/yy', { locale: ptBR })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pending tasks */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Tarefas Pendentes</h3>
            <Clock size={14} className="text-text-muted" />
          </div>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-text-muted">
              Nenhuma tarefa pendente
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 bg-bg-surface rounded-lg border border-border-subtle"
                >
                  <div className="flex items-start gap-2 justify-between">
                    <p className="text-xs text-text-primary font-medium leading-snug flex-1">{task.title}</p>
                    <PriorityBadge priority={task.priority} className="shrink-0" />
                  </div>
                  {task.dueDate && (
                    <p className="text-[10px] text-text-muted mt-1">
                      Prazo: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
