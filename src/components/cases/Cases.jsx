import { useState, useMemo } from 'react'
import { Plus, LayoutGrid, List, Columns, Table2, Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { CaseCard } from './CaseCard'
import { CaseTable } from './CaseTable'
import { CaseKanban } from './CaseKanban'
import { CreateCaseModal } from './CreateCaseModal'
import { EmptyState } from '@/components/ui/EmptyState'

const VIEW_MODES = [
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
  { id: 'list', icon: List, label: 'Lista' },
  { id: 'kanban', icon: Columns, label: 'Kanban' },
  { id: 'table', icon: Table2, label: 'Tabela' },
]

const FILTER_OPTIONS = {
  status: [
    { value: '', label: 'Todos status' },
    { value: 'active', label: 'Ativo' },
    { value: 'pending', label: 'Pendente' },
    { value: 'suspended', label: 'Suspenso' },
    { value: 'closed', label: 'Encerrado' },
  ],
  priority: [
    { value: '', label: 'Todas prioridades' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' },
  ],
  risk: [
    { value: '', label: 'Todos riscos' },
    { value: 'critical', label: 'Crítico' },
    { value: 'high', label: 'Alto' },
    { value: 'medium', label: 'Médio' },
    { value: 'low', label: 'Baixo' },
  ],
}

export function Cases() {
  const { cases, caseViewMode, dispatch } = useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', priority: '', risk: '' })

  const setViewMode = (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))
  const clearFilters = () => { setSearch(''); setFilters({ status: '', priority: '', risk: '' }) }

  const hasFilters = search || filters.status || filters.priority || filters.risk

  const filtered = useMemo(() => {
    return cases.filter(c => {
      if (search) {
        const q = search.toLowerCase()
        if (!c.title.toLowerCase().includes(q) && !c.ref.toLowerCase().includes(q) && !c.tags?.some(t => t.includes(q))) return false
      }
      if (filters.status && c.status !== filters.status) return false
      if (filters.priority && c.priority !== filters.priority) return false
      if (filters.risk && c.risk !== filters.risk) return false
      return true
    })
  }, [cases, search, filters])

  const selectClass = "bg-bg-surface border border-border-main rounded-md px-3 py-1.5 text-xs text-text-secondary focus:border-primary/60 focus:outline-none transition-colors cursor-pointer"

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Gestão de Casos</h1>
          <p className="text-sm text-text-muted mt-0.5">{filtered.length} caso{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          Novo Caso
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, ref, tag..."
            className="w-full pl-8 pr-3 py-1.5 bg-bg-surface border border-border-main rounded-md text-xs text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"
          />
        </div>

        {/* Filters */}
        <SlidersHorizontal size={13} className="text-text-muted" />
        {Object.entries(FILTER_OPTIONS).map(([key, options]) => (
          <select
            key={key}
            value={filters[key]}
            onChange={e => setFilter(key, e.target.value)}
            className={selectClass}
          >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors">
            <X size={12} /> Limpar
          </button>
        )}

        <div className="flex-1" />

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 bg-bg-surface border border-border-main rounded-md p-0.5">
          {VIEW_MODES.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              title={label}
              className={cn(
                'p-1.5 rounded transition-all',
                caseViewMode === id
                  ? 'bg-primary/20 text-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum caso encontrado"
          description={hasFilters ? 'Tente ajustar os filtros de busca.' : 'Crie o primeiro caso operacional.'}
          action={!hasFilters ? { label: 'Novo Caso', onClick: () => setCreateOpen(true) } : undefined}
        />
      ) : caseViewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => <CaseCard key={c.id} c={c} />)}
        </div>
      ) : caseViewMode === 'list' ? (
        <div className="space-y-2">
          {filtered.map(c => <CaseCard key={c.id} c={c} compact />)}
        </div>
      ) : caseViewMode === 'kanban' ? (
        <CaseKanban cases={filtered} />
      ) : (
        <div className="card overflow-hidden">
          <CaseTable cases={filtered} />
        </div>
      )}

      <CreateCaseModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
