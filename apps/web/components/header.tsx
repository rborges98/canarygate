import React from 'react'
import Link from 'next/link'
import { cn } from '@/shared/utils'
import { Logo } from '@/components/logo'

export { Logo }

export function Header({
  right,
  className
}: {
  right?: React.ReactNode
  className?: string
}) {
  return (
    <nav
      className={cn(
        'border-cg-bg-100 relative z-10 flex items-center justify-between border-b px-4 py-3 sm:px-8 sm:py-4',
        className
      )}
    >
      <Link href="/">
        <Logo />
      </Link>
      <div>{right}</div>
    </nav>
  )
}

export default Header
