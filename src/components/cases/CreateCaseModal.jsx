import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'

export function CreateCaseModal({ open, onClose }) {
  const { createCase, users } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    summary: '',
    status: 'active',
    priority: 'medium',
    risk: 'medium',
    assignedTo: 'u1',
    tags: '',
  })

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const newCase = createCase({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    onClose()
    setForm({ title: '', summary: '', status: 'active', priority: 'medium', risk: 'medium', assignedTo: 'u1', tags: '' })
    navigate(`/cases/${newCase.id}`)
  }

  const inputClass = "w-full bg-bg-surface border border-border-main rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"
  const selectClass = `${inputClass} cursor-pointer`
  const labelClass = "block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider"

  return (
    <Modal open={open} onClose={onClose} title="Novo Caso" size="md">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label className={labelClass}>Título do Caso *</label>
          <input
            className={inputClass}
            placeholder="Ex: Operação Espelho Negro"
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Resumo Inicial</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Descreva brevemente o objeto da investigação..."
            value={form.summary}
            onChange={e => handleChange('summary', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Prioridade</label>
            <select className={selectClass} value={form.priority} onChange={e => handleChange('priority', e.target.value)}>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Risco</label>
            <select className={selectClass} value={form.risk} onChange={e => handleChange('risk', e.target.value)}>
              <option value="critical">Crítico</option>
              <option value="high">Alto</option>
              <option value="medium">Médio</option>
              <option value="low">Baixo</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Responsável</label>
            <select className={selectClass} value={form.assignedTo} onChange={e => handleChange('assignedTo', e.target.value)}>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Tags (separadas por vírgula)</label>
          <input
            className={inputClass}
            placeholder="Ex: fraude, fiscal, multinacional"
            value={form.tags}
            onChange={e => handleChange('tags', e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!form.title.trim()}>
            Criar Caso
          </Button>
        </div>
      </form>
    </Modal>
  )
}
