import { useState, useEffect, useRef } from 'react'
import { Search, Bell, ChevronDown, FolderOpen, User, X, Settings, LogOut, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useApp } from '@/context/AppContext'
import { StatusBadge } from '@/components/ui/Badge'

export function Header() {
  const { cases, currentUser, profiles, globalSearch, dispatch, logout } = useApp()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setQuery('')
        setResults([])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.toLowerCase()
    const caseResults = cases
      .filter(c => c.title.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q) || c.tags?.some(t => t.includes(q)))
      .slice(0, 5)
      .map(c => ({ type: 'case', id: c.id, title: c.title, subtitle: c.ref, status: c.status }))
    setResults(caseResults)
  }, [query, cases])

  const handleResultClick = (result) => {
    if (result.type === 'case') {
      navigate(`/cases/${result.id}`)
    }
    setSearchOpen(false)
    setQuery('')
    setResults([])
  }

  const criticalCount = cases.filter(c => c.risk === 'critical' && c.status === 'active').length

  return (
    <header className="h-14 flex items-center px-6 gap-4 border-b border-border-subtle bg-bg-secondary shrink-0 z-30">
      {/* Search trigger */}
      <button
        onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
        className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface border border-border-main rounded-lg
                   text-text-muted hover:border-primary/40 hover:text-text-secondary transition-colors text-sm flex-1 max-w-xs"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Buscar casos...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-bg-hover border border-border-main rounded text-[10px] font-mono">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      <div className="flex-1" />

      {/* Alerts */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        title="Alertas"
      >
        <Bell size={16} />
        {criticalCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-alert animate-pulse" />
        )}
      </button>

      {/* User dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(p => !p)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-bg-hover transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary/30 border border-primary/40 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-accent">{currentUser.initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-text-primary">{currentUser.name}</div>
            <div className="text-[10px] text-text-muted capitalize">{currentUser.role}</div>
          </div>
          <ChevronDown size={12} className={cn('text-text-muted transition-transform', userMenuOpen && 'rotate-180')} />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-bg-card border border-border-main rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-xs font-semibold text-text-primary">{currentUser.name}</p>
              <p className="text-[10px] text-text-muted font-mono">@{currentUser.username}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                <Settings size={14} className="text-text-muted" />
                Configurações
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                >
                  <Shield size={14} className="text-accent" />
                  Painel Admin
                </button>
              )}
              <div className="border-t border-border-subtle my-1" />
              <button
                onClick={() => { logout(); setUserMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-alert hover:bg-alert/10 transition-colors"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setSearchOpen(false); setQuery('') }} />
          <div className="relative w-full max-w-xl bg-bg-card border border-border-main rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-fade-in overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-main">
              <Search size={16} className="text-text-muted shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar casos, investigados, notas..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
                  <X size={14} />
                </button>
              )}
            </div>
            {results.length > 0 && (
              <div className="py-2">
                <p className="section-title px-4 mb-2">Casos</p>
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleResultClick(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors text-left"
                  >
                    <FolderOpen size={14} className="text-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{r.title}</div>
                      <div className="text-xs text-text-muted mono">{r.subtitle}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </button>
                ))}
              </div>
            )}
            {query && results.length === 0 && (
              <div className="py-8 text-center text-sm text-text-muted">
                Nenhum resultado para "{query}"
              </div>
            )}
            {!query && (
              <div className="py-6 text-center text-xs text-text-muted">
                Digite para buscar casos, investigados ou notas
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
