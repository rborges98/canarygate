import { cn } from '@/shared/utils'

type BadgeVariant =
  | 'enabled'
  | 'disabled'
  | 'canary'
  | 'owner'
  | 'member'
  | 'admin'
  | 'created'
  | 'deleted'
  | 'rollout'

const variantStyles: Record<BadgeVariant, string> = {
  enabled: 'bg-cg-green-300 text-cg-green-100 border border-cg-green-200',
  disabled: 'bg-cg-red-300 text-cg-red-100 border border-cg-red-200',
  canary:
    'bg-cg-yellow-400 text-cg-yellow-200 border border-[rgba(234,179,8,0.22)]',
  owner: 'bg-cg-indigo-950 text-cg-indigo-100 border border-cg-indigo-600',
  member: 'bg-cg-indigo-950 text-cg-indigo-100 border border-cg-indigo-600',
  admin: 'bg-cg-indigo-950 text-cg-indigo-100 border border-cg-indigo-600',
  created: 'bg-cg-indigo-950 text-cg-indigo-100 border border-cg-indigo-600',
  deleted: 'bg-cg-red-300 text-cg-red-100 border border-cg-red-200',
  rollout:
    'bg-cg-yellow-400 text-cg-yellow-200 border border-[rgba(234,179,8,0.22)]'
}

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
