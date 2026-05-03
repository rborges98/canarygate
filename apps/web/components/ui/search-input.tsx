import { cn } from '@/shared/utils'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className
}: SearchInputProps) {
  return (
    <div
      className={cn(
        'border-cg-bg-100 bg-cg-bg-200 flex flex-1 items-center gap-2 rounded-lg border px-3 py-2',
        className
      )}
    >
      <svg
        className="text-cg-neutral-400 h-3.5 w-3.5 shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6.5" cy="6.5" r="4" />
        <path d="M10 10l3 3" />
      </svg>
      <input
        className="text-cg-neutral-100 placeholder:text-cg-neutral-600 flex-1 bg-transparent font-sans text-[12px] outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
