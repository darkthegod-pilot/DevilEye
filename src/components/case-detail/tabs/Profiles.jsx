import { useEffect } from 'react'
import { User, Building2, Plus, Phone, Mail, MapPin, Tag, ExternalLink } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

const TYPE_CONFIG = {
  person: { icon: User, label: 'Pessoa Física', color: 'text-accent', border: 'border-l-accent' },
  company: { icon: Building2, label: 'Empresa / CNPJ', color: 'text-primary-hover', border: 'border-l-primary-hover' },
  entity: { icon: Tag, label: 'Entidade', color: 'text-warning', border: 'border-l-warning' },
}

const CLASSIFICATION_LABELS = {
  primary: { label: 'Alvo Principal', variant: 'alert' },
  secondary: { label: 'Secundário', variant: 'default' },
  associate: { label: 'Associado', variant: 'warning' },
  witness: { label: 'Testemunha', variant: 'primary' },
}

function ProfileCard({ profile, onView }) {
  const config = TYPE_CONFIG[profile.type] || TYPE_CONFIG.person
  const Icon = config.icon
  const cls = CLASSIFICATION_LABELS[profile.classification] || CLASSIFICATION_LABELS.secondary

  return (
    <div className={cn('card p-5 border-l-2 hover:border-border-main transition-all', config.border)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-lg bg-bg-surface border border-border-subtle', config.color)}>
            <Icon size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{profile.name}</p>
            {profile.aliases?.length > 0 && (
              <p className="text-[10px] text-text-muted">aka: {profile.aliases.slice(0, 2).join(', ')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={cls.variant}>{cls.label}</Badge>
          <button
            onClick={() => onView(profile)}
            className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-bg-hover transition-colors"
          >
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {profile.document && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Tag size={11} className="text-text-muted shrink-0" />
            <span className="font-mono">{profile.document}</span>
          </div>
        )}
        {profile.phones?.slice(0, 1).map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
            <Phone size={11} className="text-text-muted shrink-0" />
            <span>{p}</span>
          </div>
        ))}
        {profile.emails?.slice(0, 1).map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
            <Mail size={11} className="text-text-muted shrink-0" />
            <span className="truncate">{e}</span>
          </div>
        ))}
        {profile.addresses?.slice(0, 1).map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
            <MapPin size={11} className="text-text-muted shrink-0" />
            <span className="truncate">{a}</span>
          </div>
        ))}
      </div>

      {profile.notes && (
        <p className="text-xs text-text-muted mt-3 pt-2 border-t border-border-subtle leading-relaxed line-clamp-2">
          {profile.notes}
        </p>
      )}

      {profile.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {profile.tags.map(t => <Badge key={t} className="text-[10px] py-0">{t}</Badge>)}
        </div>
      )}

      {profile.links?.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border-subtle">
          <p className="section-title mb-1.5">Vínculos</p>
          {profile.links.map((link, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-text-muted">
              <div className="w-1 h-1 rounded-full bg-accent" />
              <span>{link.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Profiles({ caseId }) {
  const { profiles, loadProfiles, openSidePanel } = useApp()
  useEffect(() => { if (caseId) loadProfiles(caseId) }, [caseId])
  const caseProfiles = profiles[caseId] || []

  const handleView = (profile) => openSidePanel('profile', profile)

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Perfis Investigados</h2>
          <p className="text-xs text-text-muted mt-0.5">{caseProfiles.length} perfil{caseProfiles.length !== 1 ? 'is' : ''} cadastrado{caseProfiles.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="accent" size="sm">
          <Plus size={13} />
          Novo Perfil
        </Button>
      </div>

      {caseProfiles.length === 0 ? (
        <EmptyState
          icon={User}
          title="Nenhum investigado cadastrado"
          description="Adicione perfis de pessoas, empresas ou entidades relacionadas ao caso."
          action={{ label: 'Novo Perfil', onClick: () => {} }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {caseProfiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} onView={handleView} />
          ))}
        </div>
      )}
    </div>
  )
}
