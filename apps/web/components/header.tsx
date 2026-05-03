import React from 'react'
import { cn } from '@/shared/utils'
import { Logo } from '@/components/ui/logo'

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
        'relative z-10 flex items-center justify-between px-8 py-4',
        className
      )}
    >
      <Logo />
      <div>{right}</div>
    </nav>
  )
}

export default Header
