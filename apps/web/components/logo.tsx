import { cn } from '@/shared/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('text-[17px] font-bold text-white', className)}>
      Canary<span className="text-cg-indigo-300">Gate</span>
    </div>
  )
}

export default Logo