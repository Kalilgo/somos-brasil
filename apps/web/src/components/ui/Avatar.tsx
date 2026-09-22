import type { AppUser } from '@/types/db'
import { cn } from '@/lib/utils/cn'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  user?: Pick<AppUser, 'emoji' | 'color' | 'name'> | null
  size?: Size
  className?: string
  title?: string
}

const sizes: Record<Size, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-lg',
  lg: 'h-14 w-14 text-2xl',
  xl: 'h-20 w-20 text-4xl',
}

export function Avatar({ user, size = 'md', className, title }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={user?.name ?? 'avatar'}
      title={title ?? user?.name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full',
        'border-2 border-white shadow-md',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: user?.color ?? '#A9A29A' }}
    >
      <span className="drop-shadow-sm">{user?.emoji ?? '❓'}</span>
    </span>
  )
}