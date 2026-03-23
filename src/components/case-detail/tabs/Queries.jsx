import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Plus, Star } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Concluída' },
  pending:   { icon: Clock,       color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Aguardando' },
  failed:    { icon: XCircle,     color: 'text-alert',   bg: 'bg-alert/10',   border: 'border-alert/20',   label: 'Falhou' },
}

const RELIABILITY_CONFIG = {
  high:   { label: 'Alta Confiabilidade', color: 'text-success' },
  medium: { label: 'Confiabilidade Média', color: 'text-warning' },
  low:    { label: 'Baixa Confiabilidade', color: 'text-alert' },
}

const inputClass = "w-full bg-bg-surface border border-border-main rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"

function AddQueryModal({ open, onClose, caseId }) {
  const { addQuery, currentUser, toast } = useApp()
  const [form, setForm] = useState({
    source: '', queryType: '', queryParam: '',
    status: 'pending', reliability: 'high',
    resultSummary: '', notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.source.trim() || !form.queryParam.trim()) return
    setLoading(true)
    try {
      await addQuery(caseId, { ...form, authorId: currentUser.id })
      toast('Consulta registrada!', 'success')
      onClose()
      setForm({ source: '', queryType: '', queryParam: '', status: 'pending', reliability: 'high', resultSummary: '', notes: '' })
    } catch { toast('Erro ao registrar consulta.', 'error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Consulta" size="lg">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Fonte *</label>
            <input className={inputClass} placeholder="Ex: Receita Federal, Coaf, DETRAN" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Tipo de Consulta</label>
            <input className={inputClass} placeholder="Ex: CPF, CNPJ, Placa, RIF" value={form.queryType} onChange={e => setForm(p => ({ ...p, queryType: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Parâmetro Consultado *</label>
          <input className={inputClass} placeholder="Ex: 123.456.789-00 ou placa AAA-0000" value={form.queryParam} onChange={e => setForm(p => ({ ...p, queryParam: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Status</label>
            <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="pending">Aguardando</option>
              <option value="completed">Concluída</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Confiabilidade</label>
            <select className={inputClass} value={form.reliability} onChange={e => setForm(p => ({ ...p, reliability: e.target.value }))}>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Resultado</label>
          <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Resumo do resultado obtido..." value={form.resultSummary} onChange={e => setForm(p => ({ ...p, resultSummary: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Observações</label>
          <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Notas adicionais sobre a consulta..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!form.source.trim() || !form.queryParam.trim() || loading}>
            {loading ? 'Salvando...' : 'Registrar Consulta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function QueryCard({ query }) {
  const status = STATUS_CONFIG[query.status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon
  const reliability = query.reliability ? RELIABILITY_CONFIG[query.reliability] : null

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg border shrink-0 mt-0.5', status.bg, status.border)}>
            <StatusIcon size={14} className={status.color} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-text-primary">{query.source}</span>
              <Badge>{query.queryType}</Badge>
            </div>
            <p className="text-xs text-text-muted font-mono">{query.queryParam}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <Badge variant={query.status === 'completed' ? 'success' : query.status === 'pending' ? 'warning' : 'alert'}>
            {status.label}
          </Badge>
          <div className="text-[10px] text-text-muted mt-1">
            {format(new Date(query.timestamp), 'dd/MM/yy HH:mm', { locale: ptBR })}
          </div>
        </div>
      </div>

      {query.resultSummary && (
        <div className="bg-bg-surface border border-border-subtle rounded-md px-4 py-3 mb-3">
          <p className="section-title mb-1.5">Resultado</p>
          <p className="text-xs text-text-secondary leading-relaxed">{query.resultSummary}</p>
        </div>
      )}

      {query.notes && (
        <div className="mb-3">
          <p className="section-title mb-1">Observações</p>
          <p className="text-xs text-text-secondary leading-relaxed">{query.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[10px] text-text-muted">
        {reliability && (
          <span className={reliability.color}>{reliability.label}</span>
        )}
        {query.linkedProfileId && (
          <span className="text-accent">Vinculada a investigado</span>
        )}
      </div>
    </div>
  )
}

export function Queries({ caseId }) {
  const { queries, loadQueries } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  useEffect(() => { if (caseId) loadQueries(caseId) }, [caseId])
  const caseQueries = queries[caseId] || []

  const completed = caseQueries.filter(q => q.status === 'completed').length
  const pending = caseQueries.filter(q => q.status === 'pending').length

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Consultas e Fontes de Dados</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {caseQueries.length} consulta{caseQueries.length !== 1 ? 's' : ''} · {completed} concluída{completed !== 1 ? 's' : ''} · {pending} aguardando
          </p>
        </div>
        <Button variant="accent" size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          Nova Consulta
        </Button>
      </div>

      {/* Source badges */}
      {caseQueries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[...new Set(caseQueries.map(q => q.source))].map(source => (
            <Badge key={source} variant="primary">{source}</Badge>
          ))}
        </div>
      )}

      {caseQueries.length === 0 ? (
        <EmptyState icon={Search} title="Sem consultas registradas" description="Registre consultas realizadas em fontes externas e bases de dados." action={{ label: 'Nova Consulta', onClick: () => setAddOpen(true) }} />
      ) : (
        <div className="space-y-4">
          {caseQueries.map(q => <QueryCard key={q.id} query={q} />)}
        </div>
      )}

      <AddQueryModal open={addOpen} onClose={() => setAddOpen(false)} caseId={caseId} />
    </div>
  )
}
