import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Pin, Lock, FileText, Brain, ShieldAlert, Lightbulb, Clock, AlignLeft, CheckCircle2, Zap } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

const NOTE_TYPE_CONFIG = {
  quick:       { label: 'Nota Rápida',    icon: Zap,          color: 'text-text-secondary', border: 'border-border-main', accent: '#94a3b8' },
  analytical:  { label: 'Analítica',      icon: Brain,        color: 'text-accent',          border: 'border-accent/30', accent: '#00c2e0' },
  sensitive:   { label: 'Sensível',       icon: ShieldAlert,  color: 'text-alert',           border: 'border-alert/30', accent: '#dc2626' },
  hypothesis:  { label: 'Hipótese',       icon: Lightbulb,    color: 'text-warning',         border: 'border-warning/30', accent: '#d97706' },
  pending:     { label: 'Pendência',      icon: Clock,        color: 'text-warning',         border: 'border-warning/20', accent: '#d97706' },
  summary:     { label: 'Resumo Parcial', icon: AlignLeft,    color: 'text-primary-hover',   border: 'border-primary/30', accent: '#1d7da3' },
  conclusion:  { label: 'Conclusão',      icon: CheckCircle2, color: 'text-success',         border: 'border-success/30', accent: '#16a34a' },
}

function NoteCard({ note }) {
  const config = NOTE_TYPE_CONFIG[note.type] || NOTE_TYPE_CONFIG.quick
  const Icon = config.icon

  return (
    <div className={cn('card p-4 border-l-2 transition-all', config.border)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Icon size={13} className={config.color} />
          <span className="text-xs font-semibold text-text-primary">{note.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {note.pinned && <Pin size={11} className="text-accent" />}
          {note.private && <Lock size={11} className="text-alert" />}
          <Badge>{config.label}</Badge>
        </div>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-6">{note.content}</p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle text-[10px] text-text-muted">
        <span>{format(new Date(note.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        {note.linkedProfileId && <span className="text-accent">Vinculada a investigado</span>}
      </div>
    </div>
  )
}

function AddNoteModal({ open, onClose, caseId }) {
  const { addNote, currentUser } = useApp()
  const [form, setForm] = useState({ title: '', content: '', type: 'quick', pinned: false, private: false })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    await addNote(caseId, { ...form, authorId: currentUser.id, linkedProfileId: null })
    onClose()
    setForm({ title: '', content: '', type: 'quick', pinned: false, private: false })
  }

  const inputClass = "w-full bg-bg-surface border border-border-main rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"

  return (
    <Modal open={open} onClose={onClose} title="Nova Nota" size="lg">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Tipo</label>
            <select
              className={inputClass}
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            >
              {Object.entries(NOTE_TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} className="w-3 h-3" />
              <span className="text-xs text-text-secondary">Fixar nota</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.private} onChange={e => setForm(p => ({ ...p, private: e.target.checked }))} className="w-3 h-3" />
              <span className="text-xs text-text-secondary">Privada</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Título</label>
          <input className={inputClass} placeholder="Título da nota" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Conteúdo</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={8}
            placeholder="Escreva o conteúdo da nota..."
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!form.title.trim() || !form.content.trim()}>Salvar Nota</Button>
        </div>
      </form>
    </Modal>
  )
}

export function Notes({ caseId }) {
  const { notes, loadNotes } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  useEffect(() => { if (caseId) loadNotes(caseId) }, [caseId])
  const [filter, setFilter] = useState('all')

  const caseNotes = notes[caseId] || []
  const filtered = filter === 'all' ? caseNotes : caseNotes.filter(n => n.type === filter)
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Notas e Inteligência</h2>
          <p className="text-xs text-text-muted mt-0.5">{caseNotes.length} nota{caseNotes.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="accent" size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          Nova Nota
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <button
          onClick={() => setFilter('all')}
          className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all',
            filter === 'all' ? 'bg-primary/20 text-accent border-primary/30' : 'bg-bg-surface text-text-muted border-border-subtle hover:text-text-secondary'
          )}
        >
          Todas
        </button>
        {Object.entries(NOTE_TYPE_CONFIG).map(([k, v]) => {
          const Icon = v.icon
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all',
                filter === k ? `bg-primary/20 border-primary/30 ${v.color}` : 'bg-bg-surface text-text-muted border-border-subtle hover:text-text-secondary'
              )}
            >
              <Icon size={11} />
              {v.label}
            </button>
          )
        })}
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhuma nota registrada" description="Adicione notas analíticas, hipóteses e observações ao caso." action={{ label: 'Nova Nota', onClick: () => setAddOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sorted.map(note => <NoteCard key={note.id} note={note} />)}
        </div>
      )}

      <AddNoteModal open={addOpen} onClose={() => setAddOpen(false)} caseId={caseId} />
    </div>
  )
}
