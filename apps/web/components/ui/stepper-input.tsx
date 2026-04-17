import { cn } from '@/shared/utils'

interface StepperInputProps {
  value: number
  min?: number
  max?: number
  suffix?: string
  onChange: (v: number) => void
  className?: string
}

export function StepperInput({
  value,
  min = 1,
  max = 100,
  suffix,
  onChange,
  className
}: StepperInputProps) {
  return (
    <div
      className={cn(
        'border-cg-bg-100 bg-cg-white-200 flex items-center overflow-hidden rounded-lg border',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="text-cg-neutral-300 hover:text-cg-neutral-100 px-3.5 py-2.5 font-mono text-[13px] leading-none transition-colors"
      >
        −
      </button>
      <span className="text-cg-neutral-100 flex-1 select-none text-center font-mono text-[12px]">
        {value}
        {suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="text-cg-neutral-300 hover:text-cg-neutral-100 px-3.5 py-2.5 font-mono text-[13px] leading-none transition-colors"
      >
        +
      </button>
    </div>
  )
}
