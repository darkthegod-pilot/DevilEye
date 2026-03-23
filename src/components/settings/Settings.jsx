import { useState, useEffect } from 'react'
import { User, Plus, Trash2, Edit2, Shield, Key, Save, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { adminApi, authApi } from '@/api/index'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

const inputClass = "w-full bg-bg-surface border border-border-main rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"

const ROLE_CONFIG = {
  admin:     { label: 'Administrador', variant: 'alert' },
  supervisor: { label: 'Supervisor',   variant: 'warning' },
  analyst:   { label: 'Analista',      variant: 'primary' },
  operator:  { label: 'Operador',      variant: 'default' },
}

function UserModal({ open, onClose, user, onSave }) {
  const [form, setForm] = useState({
    name: '', initials: '', username: '', password: '', role: 'operator',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, initials: user.initials, username: user.username, password: '', role: user.role })
    } else {
      setForm({ name: '', initials: '', username: '', password: '', role: 'operator' })
    }
    setError('')
  }, [user, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.username.trim()) return
    if (!user && !form.password.trim()) { setError('Senha é obrigatória para novo usuário.'); return }
    setLoading(true)
    setError('')
    try {
      const data = { ...form }
      if (!data.password) delete data.password
      await onSave(data)
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao salvar usuário.')
    } finally { setLoading(false) }
  }

  const autoInitials = (name) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Editar Usuário' : 'Novo Usuário'} size="md">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && (
          <div className="bg-alert/10 border border-alert/20 rounded-md px-4 py-2 text-sm text-alert">{error}</div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Nome Completo *</label>
            <input
              className={inputClass}
              placeholder="Ex: João da Silva"
              value={form.name}
              onChange={e => {
                const n = e.target.value
                setForm(p => ({ ...p, name: n, initials: autoInitials(n) }))
              }}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Iniciais</label>
            <input className={inputClass} placeholder="JS" value={form.initials} maxLength={3}
              onChange={e => setForm(p => ({ ...p, initials: e.target.value.toUpperCase() }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Usuário *</label>
            <input className={inputClass} placeholder="login" value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))} required />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Perfil</label>
            <select className={inputClass} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="operator">Operador</option>
              <option value="analyst">Analista</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">
            Senha {user ? '(deixe em branco para manter)' : '*'}
          </label>
          <div className="relative">
            <input
              className={inputClass}
              type={showPass ? 'text' : 'password'}
              placeholder={user ? 'Nova senha (opcional)' : 'Mínimo 6 caracteres'}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Salvando...' : user ? 'Salvar Alterações' : 'Criar Usuário'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ChangePasswordSection() {
  const { toast } = useApp()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) { setError('As senhas não coincidem.'); return }
    if (form.newPassword.length < 6) { setError('A nova senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword)
      toast('Senha alterada com sucesso!', 'success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message || 'Erro ao alterar senha.')
    } finally { setLoading(false) }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Key size={16} className="text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">Alterar Minha Senha</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        {error && (
          <div className="bg-alert/10 border border-alert/20 rounded-md px-4 py-2 text-sm text-alert">{error}</div>
        )}
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Senha Atual</label>
          <input className={inputClass} type={showPass ? 'text' : 'password'} placeholder="••••••••"
            value={form.currentPassword} onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Nova Senha</label>
          <input className={inputClass} type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
            value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Confirmar Nova Senha</label>
          <input className={inputClass} type={showPass ? 'text' : 'password'} placeholder="Repita a nova senha"
            value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-muted">
            <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} className="w-3 h-3" />
            Mostrar senhas
          </label>
        </div>
        <Button type="submit" variant="primary" disabled={loading} size="sm">
          {loading ? 'Alterando...' : 'Alterar Senha'}
        </Button>
      </form>
    </div>
  )
}

function AdminUserManager() {
  const { toast } = useApp()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [stats, setStats] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const [u, s] = await Promise.all([adminApi.getUsers(), adminApi.getStats()])
      setUsers(u)
      setStats(s)
    } catch { toast('Erro ao carregar usuários.', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  const handleSave = async (data) => {
    if (editUser) {
      const updated = await adminApi.updateUser(editUser.id, data)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      toast('Usuário atualizado!', 'success')
    } else {
      const created = await adminApi.createUser(data)
      setUsers(prev => [...prev, created])
      toast('Usuário criado!', 'success')
    }
  }

  const handleDelete = async (user) => {
    if (!confirm(`Excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await adminApi.deleteUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      toast('Usuário excluído.', 'info')
    } catch (err) { toast(err.message || 'Erro ao excluir usuário.', 'error') }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Gerenciar Usuários</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-bg-hover transition-colors" title="Recarregar">
            <RefreshCw size={13} />
          </button>
          <Button variant="accent" size="sm" onClick={() => { setEditUser(null); setModalOpen(true) }}>
            <Plus size={13} />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Stats rápidas */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Usuários', value: stats.users, color: 'text-accent' },
            { label: 'Casos', value: stats.cases, color: 'text-text-primary' },
            { label: 'Perfis', value: stats.profiles, color: 'text-primary-hover' },
            { label: 'Tarefas', value: stats.tasks, color: 'text-warning' },
          ].map(s => (
            <div key={s.label} className="bg-bg-surface border border-border-subtle rounded-lg p-3 text-center">
              <div className={cn('text-xl font-bold', s.color)}>{s.value}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-text-muted">Carregando usuários...</div>
      ) : (
        <div className="space-y-2">
          {users.map(user => {
            const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.operator
            return (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border-subtle hover:border-border-main transition-colors group">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{user.name}</span>
                    <Badge variant={roleConf.variant}>{roleConf.label}</Badge>
                  </div>
                  <span className="text-xs text-text-muted font-mono">@{user.username}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditUser(user); setModalOpen(true) }}
                    className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-bg-hover transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="p-1.5 rounded text-text-muted hover:text-alert hover:bg-alert/10 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editUser}
        onSave={handleSave}
      />
    </div>
  )
}

export function Settings() {
  const { currentUser } = useApp()
  const isAdmin = currentUser?.role === 'admin'

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary mb-1">Configurações</h1>
        <p className="text-sm text-text-muted">Gerencie seu perfil, senha e preferências do sistema.</p>
      </div>

      {/* Perfil do usuário */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Meu Perfil</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-lg font-bold text-accent">
            {currentUser?.initials}
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">{currentUser?.name}</p>
            <p className="text-sm text-text-muted font-mono">@{currentUser?.username}</p>
            <div className="mt-1">
              <Badge variant={ROLE_CONFIG[currentUser?.role]?.variant || 'default'}>
                {ROLE_CONFIG[currentUser?.role]?.label || currentUser?.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Alterar senha */}
      <div className="mb-4">
        <ChangePasswordSection />
      </div>

      {/* Gerenciar usuários — apenas admin */}
      {isAdmin && (
        <AdminUserManager />
      )}

      {!isAdmin && (
        <div className="card p-5 border-border-subtle opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-text-muted" />
            <h3 className="text-sm font-semibold text-text-muted">Gerenciamento de Usuários</h3>
          </div>
          <p className="text-xs text-text-muted">Disponível apenas para administradores do sistema.</p>
        </div>
      )}
    </div>
  )
}
