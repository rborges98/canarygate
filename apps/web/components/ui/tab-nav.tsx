'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [indicator, setIndicator] = useState<{
    left: number
    width: number
  } | null>(null)

  const activeHref = tabs.find(
    (t) => pathname === t.href || pathname.startsWith(t.href + '/')
  )?.href

  useEffect(() => {
    const el = activeHref ? linkRefs.current[activeHref] : null
    const container = containerRef.current
    if (!el || !container) {
      return
    }

    const containerLeft = container.getBoundingClientRect().left
    const rect = el.getBoundingClientRect()
    setIndicator({
      left: rect.left - containerLeft + container.scrollLeft,
      width: rect.width
    })
  }, [activeHref, tabs])

  return (
    <div
      ref={containerRef}
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
            ref={(el) => {
              linkRefs.current[tab.href] = el
            }}
            className={cn(
              'cursor-pointer px-4 py-2.5 text-[13px] whitespace-nowrap transition-colors duration-200',
              isActive
                ? 'text-white'
                : 'text-cg-neutral-400 hover:text-cg-neutral-300'
            )}
          >
            {tab.label}
          </Link>
        )
      })}

      {indicator && (
        <span
          className="bg-cg-indigo-300 absolute bottom-0 h-0.5 transition-all duration-300 ease-in-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
    </div>
  )
}

export default TabNav
