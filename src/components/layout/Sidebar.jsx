import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, ChevronLeft, ChevronRight,
  Shield, Settings, Bell, Activity
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { useApp } from '@/context/AppContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cases', icon: FolderOpen, label: 'Casos' },
]

const BOTTOM_ITEMS = [
  { to: '/notifications', icon: Bell, label: 'Alertas' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
]

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'nav-item group relative',
        isActive ? 'nav-item-active' : 'nav-item-default'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-bg-card border border-border-main rounded text-xs text-text-primary whitespace-nowrap
                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {label}
        </div>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { cases } = useApp()

  const activeCases = cases.filter(c => c.status === 'active').length
  const criticalCases = cases.filter(c => c.risk === 'critical' && c.status === 'active').length

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col',
        'bg-bg-secondary border-r border-border-subtle',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-14 flex items-center border-b border-border-subtle shrink-0 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-wider">
              <span className="text-text-primary">DEVIL</span>
              <span className="text-accent">EYE</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Status summary */}
      {!collapsed && (
        <div className="mx-3 mt-3 p-3 bg-bg-surface rounded-lg border border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={12} className="text-accent" />
            <span className="text-xs text-text-muted font-medium uppercase tracking-widest">Operações</span>
          </div>
          <div className="flex justify-between text-xs mt-1.5">
            <div>
              <div className="text-text-muted">Ativas</div>
              <div className="text-text-primary font-semibold text-base">{activeCases}</div>
            </div>
            <div>
              <div className="text-text-muted">Críticas</div>
              <div className="text-alert font-semibold text-base">{criticalCases}</div>
            </div>
            <div>
              <div className="text-text-muted">Total</div>
              <div className="text-text-primary font-semibold text-base">{cases.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="section-title px-3 mb-2">Navegação</p>
        )}
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-border-subtle pt-3">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </div>

      {/* Collapse toggle (when collapsed) */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-3 p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </aside>
  )
}
