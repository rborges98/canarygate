import { cn } from '@/shared/utils'

export type UserAvatarVariant = 'muted' | 'filled'

type UserAvatarProps = {
  initial: string
  variant?: UserAvatarVariant
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({
  initial,
  variant = 'muted',
  size = 'md',
  className
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-mono font-bold',
        size === 'sm' && 'h-7 w-7 text-[10px]',
        size === 'md' && 'h-8 w-8 text-[11px]',
        size === 'lg' && 'h-12 w-12 text-base',
        variant === 'filled'
          ? 'bg-cg-indigo-950 border-cg-indigo-600 text-cg-indigo-100 border'
          : 'bg-cg-bg-100 text-cg-neutral-400',
        className
      )}
    >
      {initial}
    </div>
  )
}

export default UserAvatar
