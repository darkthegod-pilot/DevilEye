import { useState } from 'react'
import { Archive, CheckCircle, RotateCcw, AlertTriangle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

const CLOSURE_TYPES = [
  { id: 'encerrado', label: 'Encerrado', description: 'Investigação concluída com resultado definitivo.' },
  { id: 'arquivado', label: 'Arquivado', description: 'Caso arquivado por falta de provas ou elementos.' },
  { id: 'suspenso', label: 'Suspenso', description: 'Investigação suspensa por decisão judicial ou administrativa.' },
  { id: 'referenciado', label: 'Referenciado', description: 'Caso referenciado a outra autoridade competente.' },
]

export function Closure({ caseId, c }) {
  const { updateCase } = useApp()
  const [form, setForm] = useState({
    closureType: c.closureStatus || 'encerrado',
    summary: '',
    conclusion: '',
    mainFindings: '',
    result: '',
    nextSteps: '',
    internalRecommendation: '',
  })
  const [submitted, setSubmitted] = useState(!!c.closureStatus)

  const isClosed = c.status === 'closed'

  const handleSubmit = (e) => {
    e.preventDefault()
    updateCase(caseId, {
      status: 'closed',
      closureStatus: form.closureType,
    })
    setSubmitted(true)
  }

  const handleReopen = () => {
    updateCase(caseId, { status: 'active', closureStatus: null })
    setSubmitted(false)
  }

  const inputClass = "w-full bg-bg-surface border border-border-main rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Fechamento de Caso</h2>
          <p className="text-xs text-text-muted mt-0.5">Conclusão formal da investigação</p>
        </div>
        {isClosed && (
          <Button variant="ghost" size="sm" onClick={handleReopen}>
            <RotateCcw size={13} />
            Reabrir Caso
          </Button>
        )}
      </div>

      {/* Current status */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-title mb-1">Status Atual do Caso</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={c.status} />
              {c.closureStatus && <Badge variant="primary">{c.closureStatus}</Badge>}
            </div>
          </div>
          <div className={cn(
            'p-4 rounded-full',
            isClosed ? 'bg-success/10 border border-success/20' : 'bg-bg-surface border border-border-main'
          )}>
            {isClosed ? <CheckCircle size={24} className="text-success" /> : <Archive size={24} className="text-text-muted" />}
          </div>
        </div>
        {c.closureStatus && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <p className="text-xs text-text-secondary">
              Caso encerrado em {format(new Date(c.updatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
            </p>
          </div>
        )}
      </div>

      {!isClosed ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Formulário de Fechamento</h3>

            {/* Closure type */}
            <div className="mb-4">
              <label className="block text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Tipo de Encerramento</label>
              <div className="grid grid-cols-2 gap-2">
                {CLOSURE_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, closureType: type.id }))}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      form.closureType === type.id
                        ? 'border-primary/40 bg-primary/10 text-text-primary'
                        : 'border-border-main bg-bg-surface text-text-muted hover:border-border-main hover:text-text-secondary'
                    )}
                  >
                    <div className="text-xs font-semibold mb-0.5">{type.label}</div>
                    <div className="text-[10px] leading-snug">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Resumo Final</label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Resumo executivo do resultado da investigação..." value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Principais Achados</label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Liste os principais elementos identificados na investigação..." value={form.mainFindings} onChange={e => setForm(p => ({ ...p, mainFindings: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Conclusão Operacional</label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Conclusão formal da investigação..." value={form.conclusion} onChange={e => setForm(p => ({ ...p, conclusion: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Próximos Passos</label>
                  <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Se aplicável..." value={form.nextSteps} onChange={e => setForm(p => ({ ...p, nextSteps: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Recomendação Interna</label>
                  <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Recomendação para a equipe..." value={form.internalRecommendation} onChange={e => setForm(p => ({ ...p, internalRecommendation: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-alert/5 border border-alert/20 rounded-lg">
            <AlertTriangle size={14} className="text-alert shrink-0" />
            <p className="text-xs text-text-secondary">
              O fechamento do caso é uma ação formal. O caso poderá ser reaberto se necessário, mas todas as movimentações serão registradas no histórico.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" variant="danger">
              <Archive size={14} />
              Encerrar Caso Formalmente
            </Button>
          </div>
        </form>
      ) : (
        <div className="card p-6 text-center">
          <CheckCircle size={40} className="text-success mx-auto mb-3" />
          <h3 className="text-base font-semibold text-text-primary mb-1">Caso Encerrado</h3>
          <p className="text-sm text-text-secondary mb-1">
            Status: <span className="font-semibold capitalize">{c.closureStatus}</span>
          </p>
          <p className="text-xs text-text-muted">
            Este caso foi formalmente encerrado. Use o botão "Reabrir Caso" se necessário retomar a investigação.
          </p>
        </div>
      )}
    </div>
  )
}
