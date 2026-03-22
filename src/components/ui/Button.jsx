import { cn } from '@/lib/cn'

const VARIANTS = {
  primary: 'bg-primary hover:bg-primary-hover text-white border border-primary/50',
  secondary: 'bg-bg-hover hover:bg-bg-card text-text-primary border border-border-main',
  ghost: 'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-transparent',
  danger: 'bg-alert/10 hover:bg-alert/20 text-alert border border-alert/30',
  accent: 'bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-5 py-2.5 text-sm rounded-md',
  icon: 'p-2 rounded-md',
}

export function Button({ children, variant = 'secondary', size = 'md', className, disabled, onClick, type = 'button', ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 font-medium transition-all duration-150 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.secondary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
