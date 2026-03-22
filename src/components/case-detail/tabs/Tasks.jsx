import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, CheckCircle, Clock, Circle, XCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { PriorityBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

const STATUS_CONFIG = {
  pending:     { icon: Circle,      label: 'A Fazer',     color: 'text-text-muted',   next: 'in_progress' },
  in_progress: { icon: Clock,       label: 'Em Progresso',color: 'text-warning',       next: 'done' },
  done:        { icon: CheckCircle, label: 'Concluído',   color: 'text-success',       next: 'pending' },
  cancelled:   { icon: XCircle,     label: 'Cancelado',   color: 'text-text-muted',   next: 'pending' },
}

const COLUMNS = [
  { id: 'pending',     label: 'A Fazer',     accent: 'border-t-text-muted' },
  { id: 'in_progress', label: 'Em Progresso', accent: 'border-t-warning' },
  { id: 'done',        label: 'Concluído',   accent: 'border-t-success' },
]

function TaskCard({ task, caseId }) {
  const { updateTask, getUserById } = useApp()
  const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
  const Icon = config.icon
  const user = getUserById(task.assignedTo)

  const toggleStatus = () => updateTask(caseId, task.id, { status: config.next })

  return (
    <div className="card p-3 group">
      <div className="flex items-start gap-2 mb-2">
        <button onClick={toggleStatus} className={cn('mt-0.5 shrink-0 transition-colors', config.color, 'hover:opacity-70')}>
          <Icon size={14} />
        </button>
        <p className={cn('text-xs font-medium leading-snug flex-1', task.status === 'done' ? 'line-through text-text-muted' : 'text-text-primary')}>
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} className="shrink-0" />
      </div>
      {task.description && (
        <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2 ml-5">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-2 ml-5 text-[10px] text-text-muted">
        {user && (
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[7px] text-accent font-semibold">
              {user.initials}
            </div>
            <span>{user.name}</span>
          </div>
        )}
        {task.dueDate && (
          <span className={cn(new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-alert' : '')}>
            {format(new Date(task.dueDate), 'dd/MM', { locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  )
}

function AddTaskModal({ open, onClose, caseId }) {
  const { addTask, currentUser, users } = useApp()
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: 'u1', dueDate: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    addTask({ ...form, caseId, status: 'pending' })
    onClose()
    setForm({ title: '', description: '', priority: 'medium', assignedTo: 'u1', dueDate: '' })
  }

  const inputClass = "w-full bg-bg-surface border border-border-main rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"

  return (
    <Modal open={open} onClose={onClose} title="Nova Tarefa" size="md">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Título *</label>
          <input className={inputClass} placeholder="Descreva a tarefa..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Descrição</label>
          <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Detalhes adicionais..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Prioridade</label>
            <select className={inputClass} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Responsável</label>
            <select className={inputClass} value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Prazo</label>
            <input type="date" className={inputClass} value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!form.title.trim()}>Criar Tarefa</Button>
        </div>
      </form>
    </Modal>
  )
}

export function Tasks({ caseId }) {
  const { tasks } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const caseTasks = tasks[caseId] || []

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Tarefas Operacionais</h2>
          <p className="text-xs text-text-muted mt-0.5">{caseTasks.length} tarefa{caseTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="accent" size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          Nova Tarefa
        </Button>
      </div>

      {caseTasks.length === 0 ? (
        <EmptyState icon={CheckCircle} title="Sem tarefas" description="Crie tarefas operacionais para organizar o andamento da investigação." action={{ label: 'Nova Tarefa', onClick: () => setAddOpen(true) }} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = caseTasks.filter(t => t.status === col.id)
            const config = STATUS_CONFIG[col.id]
            const Icon = config.icon
            return (
              <div key={col.id}>
                <div className={cn('bg-bg-surface border border-border-main rounded-lg px-4 py-3 mb-3 border-t-2', col.accent)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className={config.color} />
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{col.label}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{colTasks.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {colTasks.map(task => <TaskCard key={task.id} task={task} caseId={caseId} />)}
                  {colTasks.length === 0 && (
                    <div className="flex items-center justify-center h-16 bg-bg-surface/50 border border-dashed border-border-main rounded-lg">
                      <span className="text-xs text-text-muted">Sem tarefas</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} caseId={caseId} />
    </div>
  )
}
