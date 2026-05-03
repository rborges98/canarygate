'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/shared/utils'
import { ENVIRONMENTS } from '@/shared/environments'

const COLORS: Record<string, { dot: string; line: string }> = {
  production: { dot: 'bg-cg-red-100', line: 'bg-cg-red-100' },
  staging: { dot: 'bg-cg-yellow-200', line: 'bg-cg-yellow-200' },
  development: { dot: 'bg-cg-indigo-300', line: 'bg-cg-indigo-300' }
}

type Props = { currentSlug: string }

export function EnvironmentSelector({ currentSlug }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState<{
    left: number
    width: number
  } | null>(null)

  useEffect(() => {
    const btn = btnRefs.current[currentSlug]
    const container = containerRef.current
    if (!btn || !container) {
      return
    }

    const { left: cLeft } = container.getBoundingClientRect()
    const { left, width } = btn.getBoundingClientRect()
    setIndicator({ left: left - cLeft, width })
  }, [currentSlug])

  function selectEnv(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('env', slug)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      {ENVIRONMENTS.map((env) => (
        <button
          key={env.slug}
          ref={(el) => {
            btnRefs.current[env.slug] = el
          }}
          type="button"
          onClick={() => selectEnv(env.slug)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 font-mono text-[12px] transition-colors duration-200',
            env.slug === currentSlug
              ? 'text-white'
              : 'text-cg-neutral-500 hover:text-cg-neutral-300'
          )}
        >
          <span
            className={cn('h-1.5 w-1.5 rounded-full', COLORS[env.slug].dot)}
          />
          {env.name}
        </button>
      ))}

      {indicator && (
        <span
          className={cn(
            'absolute bottom-0 h-0.5 transition-all duration-300 ease-in-out',
            COLORS[currentSlug]?.line ?? 'bg-cg-neutral-400'
          )}
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
    </div>
  )
}
