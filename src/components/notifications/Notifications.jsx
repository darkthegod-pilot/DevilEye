import { useApp } from '@/context/AppContext'
import { AlertTriangle, Clock, Shield, Info, CheckCircle, FolderOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'

const ALERT_CONFIG = {
  critical: { icon: AlertTriangle, color: 'text-alert', bg: 'bg-alert/10', border: 'border-alert/20', label: 'Crítico' },
  warning:  { icon: Clock,         color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Atenção' },
  info:     { icon: Info,          color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', label: 'Info' },
  success:  { icon: CheckCircle,   color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'OK' },
}

function buildAlerts(cases) {
  const alerts = []

  cases.forEach(c => {
    if (c.risk === 'critical' && c.status === 'active') {
      alerts.push({
        id: `critical-${c.id}`,
        type: 'critical',
        title: 'Caso com risco crítico ativo',
        description: `O caso "${c.title}" (${c.ref}) está ativo com risco crítico e requer atenção imediata.`,
        caseId: c.id,
        caseRef: c.ref,
        caseTitle: c.title,
        timestamp: new Date(c.updatedAt),
      })
    }

    if (c.status === 'suspended') {
      alerts.push({
        id: `suspended-${c.id}`,
        type: 'warning',
        title: 'Caso suspenso',
        description: `O caso "${c.title}" (${c.ref}) está suspenso. Verifique as condições para retomada.`,
        caseId: c.id,
        caseRef: c.ref,
        caseTitle: c.title,
        timestamp: new Date(c.updatedAt),
      })
    }

    if (c.priority === 'high' && c.status === 'pending') {
      alerts.push({
        id: `high-pending-${c.id}`,
        type: 'warning',
        title: 'Caso de alta prioridade pendente',
        description: `O caso "${c.title}" (${c.ref}) é de alta prioridade e ainda não foi iniciado.`,
        caseId: c.id,
        caseRef: c.ref,
        caseTitle: c.title,
        timestamp: new Date(c.updatedAt),
      })
    }
  })

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2, success: 3 }
    return (order[a.type] ?? 4) - (order[b.type] ?? 4)
  })
}

export function Notifications() {
  const { cases } = useApp()
  const navigate = useNavigate()

  const alerts = buildAlerts(cases)
  const criticalCount = alerts.filter(a => a.type === 'critical').length
  const warningCount = alerts.filter(a => a.type === 'warning').length

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary mb-1">Central de Alertas</h1>
        <p className="text-sm text-text-muted">
          {alerts.length === 0
            ? 'Nenhum alerta ativo no momento.'
            : `${alerts.length} alerta${alerts.length !== 1 ? 's' : ''} — ${criticalCount} crítico${criticalCount !== 1 ? 's' : ''}, ${warningCount} atenção`
          }
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Críticos', count: criticalCount, color: 'text-alert', bg: 'bg-alert/10', border: 'border-alert/20' },
          { label: 'Atenção', count: warningCount, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
          { label: 'Total Ativos', count: cases.filter(c => c.status === 'active').length, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
          { label: 'Casos Críticos', count: cases.filter(c => c.risk === 'critical').length, color: 'text-alert', bg: 'bg-alert/10', border: 'border-alert/20' },
        ].map(stat => (
          <div key={stat.label} className={cn('card p-4 border', stat.border, stat.bg)}>
            <div className={cn('text-3xl font-bold mb-1', stat.color)}>{stat.count}</div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Lista de alertas */}
      {alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle size={40} className="text-success mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">Tudo em ordem</h3>
          <p className="text-xs text-text-muted">Não há alertas ou situações críticas no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const cfg = ALERT_CONFIG[alert.type] || ALERT_CONFIG.info
            const Icon = cfg.icon
            return (
              <div
                key={alert.id}
                className={cn('card p-4 flex items-start gap-4 border cursor-pointer hover:border-border-main transition-all', cfg.border)}
                onClick={() => alert.caseId && navigate(`/cases/${alert.caseId}`)}
              >
                <div className={cn('p-2 rounded-lg border shrink-0 mt-0.5', cfg.bg, cfg.border)}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary">{alert.title}</span>
                    <Badge variant={alert.type === 'critical' ? 'alert' : alert.type === 'warning' ? 'warning' : 'primary'}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                    {alert.caseRef && (
                      <div className="flex items-center gap-1">
                        <FolderOpen size={10} />
                        <span className="font-mono">{alert.caseRef}</span>
                      </div>
                    )}
                    <span>{format(alert.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
                {alert.caseId && (
                  <div className="shrink-0 text-xs text-accent hover:underline">Ver caso</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
