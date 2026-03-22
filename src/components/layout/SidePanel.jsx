import { X, FolderOpen, User, Building2, GitBranch, FileText, CheckSquare, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useApp } from '@/context/AppContext'
import { StatusBadge, PriorityBadge, RiskBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function CasePanel({ data }) {
  const navigate = useNavigate()
  const { closeSidePanel } = useApp()

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border-main">
        <div className="mono mb-1">{data.ref}</div>
        <h2 className="text-base font-semibold text-text-primary leading-tight">{data.title}</h2>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <StatusBadge status={data.status} />
          <PriorityBadge priority={data.priority} />
          <RiskBadge risk={data.risk} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <p className="section-title mb-1.5">Resumo</p>
          <p className="text-sm text-text-secondary leading-relaxed">{data.summary}</p>
        </div>
        {data.tags?.length > 0 && (
          <div>
            <p className="section-title mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map(t => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>
        )}
        <div>
          <p className="section-title mb-1.5">Datas</p>
          <div className="space-y-1 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span className="text-text-muted">Abertura</span>
              <span>{format(new Date(data.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Atualização</span>
              <span>{format(new Date(data.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 border-t border-border-main">
        <Button
          variant="accent"
          className="w-full justify-center"
          onClick={() => { navigate(`/cases/${data.id}`); closeSidePanel() }}
        >
          <ExternalLink size={14} />
          Abrir Caso Completo
        </Button>
      </div>
    </div>
  )
}

function ProfilePanel({ data }) {
  const typeConfig = {
    person: { icon: User, label: 'Pessoa Física', color: 'text-accent' },
    company: { icon: Building2, label: 'Empresa', color: 'text-primary-hover' },
    entity: { icon: GitBranch, label: 'Entidade', color: 'text-warning' },
  }
  const config = typeConfig[data.type] || typeConfig.person
  const Icon = config.icon

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border-main">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={14} className={config.color} />
          <span className="text-xs text-text-muted">{config.label}</span>
        </div>
        <h2 className="text-base font-semibold text-text-primary">{data.name}</h2>
        {data.aliases?.length > 0 && (
          <p className="text-xs text-text-muted mt-0.5">aka: {data.aliases.join(', ')}</p>
        )}
        <div className="mt-2">
          <Badge variant={data.classification === 'primary' ? 'alert' : 'default'}>
            {data.classification === 'primary' ? 'Alvo Principal' : data.classification === 'associate' ? 'Associado' : 'Secundário'}
          </Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {data.document && (
          <div>
            <p className="section-title mb-1">Documento</p>
            <p className="text-sm text-text-secondary font-mono">{data.document}</p>
          </div>
        )}
        {data.phones?.length > 0 && (
          <div>
            <p className="section-title mb-1">Telefones</p>
            {data.phones.map((p, i) => <p key={i} className="text-sm text-text-secondary">{p}</p>)}
          </div>
        )}
        {data.addresses?.length > 0 && (
          <div>
            <p className="section-title mb-1">Endereços</p>
            {data.addresses.map((a, i) => <p key={i} className="text-sm text-text-secondary leading-relaxed">{a}</p>)}
          </div>
        )}
        {data.notes && (
          <div>
            <p className="section-title mb-1">Observações</p>
            <p className="text-sm text-text-secondary leading-relaxed">{data.notes}</p>
          </div>
        )}
        {data.tags?.length > 0 && (
          <div>
            <p className="section-title mb-1">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map(t => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OrganogramNodePanel({ data }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border-main">
        <p className="text-xs text-text-muted uppercase tracking-widest mb-1">{data.type}</p>
        <h2 className="text-base font-semibold text-text-primary">{data.label}</h2>
        {data.subtitle && <p className="text-sm text-text-secondary mt-0.5">{data.subtitle}</p>}
        {data.critical && (
          <Badge variant="alert" className="mt-2">Elemento Crítico</Badge>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {data.tags?.length > 0 && (
          <div>
            <p className="section-title mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map(t => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>
        )}
        <div className="p-3 bg-bg-surface rounded-lg border border-border-subtle text-xs text-text-muted">
          Clique duas vezes no nó no organograma para editar os detalhes deste elemento.
        </div>
      </div>
    </div>
  )
}

const PANEL_CONTENT = {
  case: CasePanel,
  profile: ProfilePanel,
  'organogram-node': OrganogramNodePanel,
}

export function SidePanel() {
  const { sidePanel, closeSidePanel } = useApp()
  const { open, contentType, data } = sidePanel

  const ContentComponent = contentType ? PANEL_CONTENT[contentType] : null

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={closeSidePanel}
        />
      )}
      <aside
        className={cn(
          'fixed right-0 top-0 h-screen w-[380px] z-50',
          'bg-bg-secondary border-l border-border-main',
          'flex flex-col shadow-panel',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-border-main shrink-0">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            {contentType === 'case' ? 'Detalhes do Caso'
              : contentType === 'profile' ? 'Perfil do Investigado'
              : contentType === 'organogram-node' ? 'Elemento do Organograma'
              : 'Detalhes'}
          </span>
          <button
            onClick={closeSidePanel}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {ContentComponent && data ? (
            <ContentComponent data={data} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-text-muted">
              Selecione um elemento para ver os detalhes
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
