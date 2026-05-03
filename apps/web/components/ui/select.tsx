import { cn } from '@/shared/utils'

type SelectOption = {
  value: string
  label: string
}

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> & {
  options: SelectOption[]
  variant?: 'form' | 'compact'
  containerClassName?: string
}

export function Select({
  options,
  variant = 'form',
  className,
  containerClassName,
  ...props
}: SelectProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <select
        className={cn(
          'scheme-dark w-full cursor-pointer appearance-none rounded-lg border outline-none transition-colors',
          variant === 'form'
            ? 'border-cg-bg-100 bg-cg-bg-200 text-cg-neutral-100 focus:border-cg-indigo-300 px-3.5 py-2.5 pr-9 text-[13px]'
            : 'border-cg-bg-100 bg-cg-bg-100 text-cg-neutral-400 px-3 py-2 pr-7 font-sans text-[11px]',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className={cn(
          'text-cg-neutral-400 pointer-events-none absolute top-1/2 -translate-y-1/2',
          variant === 'form' ? 'right-3 h-4 w-4' : 'right-2 h-3 w-3'
        )}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  )
}
