import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react'
import { authApi, setToken } from '@/api/index'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/cn'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { dispatch } = useApp()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) {
      setError('Preencha usuário e senha.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { token, user } = await authApi.login(form.username.trim(), form.password)
      setToken(token)
      localStorage.setItem('devileye-user', JSON.stringify(user))
      dispatch({ type: 'SET_USER', payload: user })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Erro ao fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 mural-grid opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 mb-4">
            <Shield size={28} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider">
            <span className="text-text-primary">DEVIL</span>
            <span className="text-accent">EYE</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">Painel de Investigação Operacional</p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-border-main rounded-xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          <h2 className="text-base font-semibold text-text-primary mb-5">Acesso Restrito</h2>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-alert/10 border border-alert/20 rounded-lg mb-4 animate-fade-in">
              <AlertCircle size={14} className="text-alert shrink-0" />
              <p className="text-xs text-alert">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">
                Usuário
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className={cn(
                  'w-full bg-bg-surface border border-border-main rounded-md px-3 py-2.5',
                  'text-sm text-text-primary placeholder:text-text-muted',
                  'focus:border-primary/60 focus:ring-1 focus:ring-primary/20 outline-none',
                  'transition-colors'
                )}
                placeholder="nome.usuario"
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className={cn(
                    'w-full bg-bg-surface border border-border-main rounded-md px-3 py-2.5 pr-10',
                    'text-sm text-text-primary placeholder:text-text-muted',
                    'focus:border-primary/60 focus:ring-1 focus:ring-primary/20 outline-none',
                    'transition-colors'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'px-4 py-2.5 rounded-md text-sm font-semibold',
                'bg-primary hover:bg-primary-hover text-white',
                'border border-primary/50',
                'transition-all duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                loading && 'animate-pulse'
              )}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-text-muted mt-4">
          Acesso monitorado · Uso exclusivo autorizado
        </p>
      </div>
    </div>
  )
}
