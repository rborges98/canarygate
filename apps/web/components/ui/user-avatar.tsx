import { cn } from '@/shared/utils'

interface UserAvatarProps {
  initial: string
  isOwner?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({
  initial,
  isOwner = false,
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
        isOwner
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
