import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

const toggleTrackVariants = cva(
  'relative shrink-0 rounded-full transition-colors',
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-10',
        lg: 'h-7 w-12'
      },
      checked: {
        true: 'bg-cg-green-100',
        false: 'bg-cg-bg-100'
      }
    },
    defaultVariants: {
      size: 'sm',
      checked: false
    }
  }
)

const toggleThumbVariants = cva(
  'absolute top-0.5 rounded-full bg-white shadow transition-transform',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
      },
      checked: {
        true: '',
        false: ''
      }
    },
    compoundVariants: [
      { size: 'sm', checked: true, className: 'translate-x-4' },
      { size: 'sm', checked: false, className: 'translate-x-0.5' },
      { size: 'md', checked: true, className: 'translate-x-[18px]' },
      { size: 'md', checked: false, className: 'translate-x-0.5' },
      { size: 'lg', checked: true, className: 'translate-x-5' },
      { size: 'lg', checked: false, className: 'translate-x-0.5' }
    ],
    defaultVariants: {
      size: 'sm',
      checked: false
    }
  }
)

type ToggleSwitchProps = VariantProps<typeof toggleTrackVariants> & {
  checked: boolean
  onCheckedChange: () => void
  className?: string
  label?: string
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  size = 'sm',
  className,
  label
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onCheckedChange}
      className={cn(toggleTrackVariants({ size, checked }), className)}
    >
      <div className={toggleThumbVariants({ size, checked })} />
    </button>
  )
}
