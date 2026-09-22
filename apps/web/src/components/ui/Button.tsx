import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-display font-bold ' +
  'outline-none transition duration-150 active:scale-[0.96] focus-visible:ring-2 ' +
  'focus-visible:ring-coral/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ' +
  'disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary: 'bg-coral text-white shadow-pop hover:bg-coral-dark',
  secondary: 'border-2 border-ink/10 bg-white text-ink shadow-card hover:border-ink/25',
  ghost: 'bg-transparent text-ink-soft hover:bg-ink/5 hover:text-ink',
  danger: 'bg-danger text-white shadow-pop hover:brightness-95',
  success: 'bg-verde text-white shadow-pop hover:bg-verde-dark',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-6 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {children}
    </button>
  )
}