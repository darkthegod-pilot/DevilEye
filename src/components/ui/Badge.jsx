import { cn } from '@/lib/cn'

const STATUS_STYLES = {
  active:    'bg-accent/10 text-accent border border-accent/20',
  pending:   'bg-warning/10 text-warning border border-warning/20',
  closed:    'bg-text-muted/10 text-text-muted border border-text-muted/20',
  suspended: 'bg-text-secondary/10 text-text-secondary border border-text-secondary/20',
  done:      'bg-success/10 text-success border border-success/20',
  in_progress: 'bg-primary/10 text-primary-hover border border-primary/20',
}

const PRIORITY_STYLES = {
  high:   'bg-alert/10 text-alert border border-alert/20',
  medium: 'bg-warning/10 text-warning border border-warning/20',
  low:    'bg-text-muted/10 text-text-muted border border-text-muted/20',
}

const RISK_STYLES = {
  critical: 'bg-alert/15 text-alert border border-alert/30',
  high:     'bg-warning/15 text-warning border border-warning/30',
  medium:   'bg-primary/15 text-primary-hover border border-primary/30',
  low:      'bg-success/15 text-success border border-success/30',
}

const STATUS_LABELS = {
  active: 'Ativo',
  pending: 'Pendente',
  closed: 'Encerrado',
  suspended: 'Suspenso',
  done: 'Concluído',
  in_progress: 'Em Andamento',
}

const PRIORITY_LABELS = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

const RISK_LABELS = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
}

export function StatusBadge({ status, className }) {
  return (
    <span className={cn('badge', STATUS_STYLES[status] || STATUS_STYLES.pending, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority, className }) {
  return (
    <span className={cn('badge', PRIORITY_STYLES[priority] || PRIORITY_STYLES.low, className)}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  )
}

export function RiskBadge({ risk, className }) {
  return (
    <span className={cn('badge', RISK_STYLES[risk] || RISK_STYLES.low, className)}>
      {RISK_LABELS[risk] || risk}
    </span>
  )
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-bg-hover text-text-secondary border border-border-main',
    accent: 'bg-accent/10 text-accent border border-accent/20',
    primary: 'bg-primary/10 text-primary-hover border border-primary/20',
    alert: 'bg-alert/10 text-alert border border-alert/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
  }
  return (
    <span className={cn('badge', variants[variant] || variants.default, className)}>
      {children}
    </span>
  )
}
