import { useApp } from '@/context/AppContext'

const RISK_CONFIG = [
  { key: 'critical', label: 'Crítico', color: 'bg-alert', textColor: 'text-alert' },
  { key: 'high', label: 'Alto', color: 'bg-warning', textColor: 'text-warning' },
  { key: 'medium', label: 'Médio', color: 'bg-primary-hover', textColor: 'text-primary-hover' },
  { key: 'low', label: 'Baixo', color: 'bg-success', textColor: 'text-success' },
]

export function RiskDistribution() {
  const { cases } = useApp()
  const activeCases = cases.filter(c => c.status === 'active' || c.status === 'pending' || c.status === 'suspended')
  const total = activeCases.length || 1

  const counts = RISK_CONFIG.reduce((acc, r) => {
    acc[r.key] = activeCases.filter(c => c.risk === r.key).length
    return acc
  }, {})

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Distribuição por Risco</h3>
        <span className="text-xs text-text-muted">{activeCases.length} operações ativas</span>
      </div>
      <div className="space-y-3">
        {RISK_CONFIG.map(({ key, label, color, textColor }) => {
          const count = counts[key] || 0
          const pct = Math.round((count / total) * 100)
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${textColor}`}>{label}</span>
                <span className="text-xs text-text-muted">{count} caso{count !== 1 ? 's' : ''} · {pct}%</span>
              </div>
              <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
