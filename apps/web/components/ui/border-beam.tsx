'use client'

import { motion } from 'motion/react'
import { cn } from '@/shared/utils'

type BorderBeamProps = {
  size?: number
  duration?: number
  delay?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
  reverse?: boolean
  className?: string
}

export const BorderBeam = ({
  size = 50,
  duration = 6,
  delay = 0,
  borderWidth = 1,
  colorFrom = '#ffaa40',
  colorTo = '#56c8ff',
  reverse = false,
  className
}: BorderBeamProps) => {
  const offsetPath = `rect(0 auto auto 0 round ${size}px)`

  return (
    <div
      style={{ '--border-beam-width': `${borderWidth}px` } as React.CSSProperties}
      className="border-(length:--border-beam-width) mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect pointer-events-none absolute inset-0 rounded-[inherit] border-transparent [mask-clip:padding-box,border-box]"
    >
      <motion.div
        className={cn('absolute aspect-square', className)}
        style={{
          width: size,
          offsetPath,
          rotate: reverse ? '180deg' : undefined,
          background: `linear-gradient(to left, transparent, ${colorFrom}, transparent)`
        }}
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration,
          delay: -delay
        }}
      />
      <motion.div
        className="absolute aspect-square"
        style={{
          width: size,
          offsetPath,
          rotate: '180deg',
          background: `linear-gradient(to left, transparent, ${colorTo}, transparent)`
        }}
        initial={{ offsetDistance: '100%' }}
        animate={{ offsetDistance: ['100%', '0%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration,
          delay: -delay
        }}
      />
    </div>
  )
}

export default BorderBeam
