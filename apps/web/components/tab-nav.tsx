'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/utils'

type Tab = {
  label: string
  href: string
}

type TabNavProps = {
  tabs: Tab[]
  className?: string
}

export function TabNav({ tabs, className }: TabNavProps) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'border-cg-bg-100 relative z-10 flex overflow-x-auto border-b px-4 sm:px-8',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'cursor-pointer whitespace-nowrap border-b-2 px-4 py-[10px] text-[13px] transition-colors',
              isActive
                ? 'border-cg-indigo-300 text-white'
                : 'text-cg-neutral-400 hover:text-cg-neutral-300 border-transparent'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

export default TabNav
