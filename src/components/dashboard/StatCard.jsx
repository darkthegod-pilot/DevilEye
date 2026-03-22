import { cn } from '@/lib/cn'

export function StatCard({ icon: Icon, label, value, sub, accentColor = 'text-accent', trend }) {
  return (
    <div className="card card-hover p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={cn('p-2 rounded-lg bg-bg-surface border border-border-subtle', accentColor)}>
          <Icon size={16} />
        </div>
        {trend && (
          <span className={cn('text-xs font-medium', trend > 0 ? 'text-success' : 'text-alert')}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-text-primary tracking-tight">{value}</div>
        <div className="text-xs text-text-muted mt-0.5">{label}</div>
      </div>
      {sub && (
        <div className="text-xs text-text-secondary border-t border-border-subtle pt-2 mt-auto">
          {sub}
        </div>
      )}
    </div>
  )
}
