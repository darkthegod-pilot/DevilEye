import { cn } from '@/lib/cn'
import { Button } from './Button'

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-bg-surface border border-border-subtle">
          <Icon size={32} className="text-text-muted" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-text-secondary mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-text-muted max-w-xs leading-relaxed mb-4">{description}</p>
      )}
      {action && (
        <Button variant="accent" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
