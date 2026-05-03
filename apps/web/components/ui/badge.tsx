import { cn } from '@/shared/utils'

export type BadgeColor = 'green' | 'red' | 'yellow' | 'indigo' | 'neutral'
export type BadgeSize = 'sm' | 'md'
export type BadgeRadius = 'full' | 'md'

const colorStyles: Record<BadgeColor, string> = {
  green: 'border border-cg-green-200 bg-cg-green-300 text-cg-green-100',
  red: 'border border-cg-red-200 bg-cg-red-300 text-cg-red-100',
  yellow:
    'border border-[rgba(234,179,8,0.22)] bg-cg-yellow-400 text-cg-yellow-200',
  indigo: 'border border-cg-indigo-600 bg-cg-indigo-950 text-cg-indigo-100',
  neutral: 'border border-cg-bg-200 bg-cg-bg-100 text-cg-neutral-300'
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-[10px] font-semibold',
  md: 'px-3 py-1.5 text-[11px] font-semibold'
}

const radiusStyles: Record<BadgeRadius, string> = {
  full: 'rounded-full',
  md: 'rounded-md'
}

type BadgeProps = {
  color?: BadgeColor
  size?: BadgeSize
  radius?: BadgeRadius
  children: React.ReactNode
  className?: string
}

export function Badge({
  color = 'indigo',
  size = 'sm',
  radius = 'full',
  children,
  className
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border font-sans leading-none',
        colorStyles[color],
        sizeStyles[size],
        radiusStyles[radius],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
