import { ArrowLeft, MoreHorizontal, ExternalLink, XCircle, RotateCcw, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useApp } from '@/context/AppContext'
import { StatusBadge, PriorityBadge, RiskBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function CaseHeader({ c }) {
  const navigate = useNavigate()
  const { getUserById, updateCase } = useApp()
  const user = getUserById(c.assignedTo)
  const isCritical = c.risk === 'critical'

  const handleClose = () => updateCase(c.id, { status: 'closed', closureStatus: 'encerrado' })
  const handleReopen = () => updateCase(c.id, { status: 'active', closureStatus: null })

  return (
    <div className={cn(
      'border-b border-border-main bg-bg-secondary sticky top-0 z-20',
      isCritical && c.status === 'active' && 'shadow-glow-alert/5'
    )}>
      {/* Critical banner */}
      {isCritical && c.status === 'active' && (
        <div className="flex items-center gap-2 px-6 py-1.5 bg-alert/10 border-b border-alert/20">
          <AlertTriangle size={12} className="text-alert" />
          <span className="text-xs text-alert font-medium">Risco Crítico — Atenção máxima requerida</span>
        </div>
      )}

      <div className="px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            Casos
          </button>
          <span className="text-text-muted text-xs">/</span>
          <span className="mono">{c.ref}</span>
        </div>

        {/* Main header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary tracking-tight leading-tight mb-2">
              {c.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.priority} />
              <RiskBadge risk={c.risk} />
              {user && (
                <div className="flex items-center gap-1.5 text-xs text-text-muted border-l border-border-main pl-2 ml-1">
                  <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] text-accent font-semibold">
                    {user.initials}
                  </div>
                  {user.name}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-text-muted">Abertura</div>
              <div className="text-xs text-text-secondary">{format(new Date(c.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</div>
              <div className="text-[10px] text-text-muted mt-1">Atualização</div>
              <div className="text-xs text-text-secondary">{format(new Date(c.updatedAt), 'dd/MM/yy HH:mm', { locale: ptBR })}</div>
            </div>
            {c.status !== 'closed' ? (
              <Button variant="danger" size="sm" onClick={handleClose}>
                <XCircle size={13} />
                Encerrar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleReopen}>
                <RotateCcw size={13} />
                Reabrir
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
