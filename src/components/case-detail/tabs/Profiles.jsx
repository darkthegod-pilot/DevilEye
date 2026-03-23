import { useEffect, useState } from 'react'
import { User, Building2, Plus, Phone, Mail, MapPin, Tag, ExternalLink, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
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

const inputClass = "w-full bg-bg-surface border border-border-main rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"

function AddProfileModal({ open, onClose, caseId }) {
  const { addProfile, toast } = useApp()
  const [form, setForm] = useState({
    type: 'person', name: '', classification: 'secondary',
    document: '', phones: '', emails: '', addresses: '',
    aliases: '', notes: '', tags: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await addProfile(caseId, {
        ...form,
        phones: form.phones.split(',').map(s => s.trim()).filter(Boolean),
        emails: form.emails.split(',').map(s => s.trim()).filter(Boolean),
        addresses: form.addresses.split(',').map(s => s.trim()).filter(Boolean),
        aliases: form.aliases.split(',').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        links: [],
      })
      toast('Perfil adicionado!', 'success')
      onClose()
      setForm({ type: 'person', name: '', classification: 'secondary', document: '', phones: '', emails: '', addresses: '', aliases: '', notes: '', tags: '' })
    } catch { toast('Erro ao adicionar perfil.', 'error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Investigado" size="lg">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Tipo</label>
            <select className={inputClass} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="person">Pessoa Física</option>
              <option value="company">Empresa / CNPJ</option>
              <option value="entity">Entidade</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Classificação</label>
            <select className={inputClass} value={form.classification} onChange={e => setForm(p => ({ ...p, classification: e.target.value }))}>
              <option value="primary">Alvo Principal</option>
              <option value="secondary">Secundário</option>
              <option value="associate">Associado</option>
              <option value="witness">Testemunha</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Nome *</label>
          <input className={inputClass} placeholder="Nome completo ou razão social" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">CPF / CNPJ</label>
            <input className={inputClass} placeholder="Documento de identificação" value={form.document} onChange={e => setForm(p => ({ ...p, document: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Apelidos (vírgula)</label>
            <input className={inputClass} placeholder="Ex: João, JR, O Chefe" value={form.aliases} onChange={e => setForm(p => ({ ...p, aliases: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Telefones (vírgula)</label>
            <input className={inputClass} placeholder="+55 11 99999-9999" value={form.phones} onChange={e => setForm(p => ({ ...p, phones: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">E-mails (vírgula)</label>
            <input className={inputClass} placeholder="email@dominio.com" value={form.emails} onChange={e => setForm(p => ({ ...p, emails: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Endereço(s) (vírgula)</label>
          <input className={inputClass} placeholder="Rua, número, cidade/UF" value={form.addresses} onChange={e => setForm(p => ({ ...p, addresses: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Tags (vírgula)</label>
          <input className={inputClass} placeholder="Ex: offshore, sócio, laranja" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Observações</label>
          <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Informações adicionais relevantes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!form.name.trim() || loading}>
            {loading ? 'Salvando...' : 'Adicionar Perfil'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ProfileCard({ profile, onView, onDelete }) {
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
            title="Detalhes"
          >
            <ExternalLink size={12} />
          </button>
          <button
            onClick={() => onDelete(profile)}
            className="p-1.5 rounded text-text-muted hover:text-alert hover:bg-alert/10 transition-colors"
            title="Remover"
          >
            <Trash2 size={12} />
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
  const { profiles, loadProfiles, deleteProfile, openSidePanel, toast } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  useEffect(() => { if (caseId) loadProfiles(caseId) }, [caseId])
  const caseProfiles = profiles[caseId] || []

  const handleView = (profile) => openSidePanel('profile', profile)

  const handleDelete = async (profile) => {
    if (!confirm(`Remover perfil "${profile.name}"?`)) return
    try {
      await deleteProfile(caseId, profile.id)
      toast('Perfil removido.', 'info')
    } catch { toast('Erro ao remover perfil.', 'error') }
  }

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Perfis Investigados</h2>
          <p className="text-xs text-text-muted mt-0.5">{caseProfiles.length} perfil{caseProfiles.length !== 1 ? 'is' : ''} cadastrado{caseProfiles.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="accent" size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          Novo Perfil
        </Button>
      </div>

      {caseProfiles.length === 0 ? (
        <EmptyState
          icon={User}
          title="Nenhum investigado cadastrado"
          description="Adicione perfis de pessoas, empresas ou entidades relacionadas ao caso."
          action={{ label: 'Novo Perfil', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {caseProfiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} onView={handleView} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddProfileModal open={addOpen} onClose={() => setAddOpen(false)} caseId={caseId} />
    </div>
  )
}
