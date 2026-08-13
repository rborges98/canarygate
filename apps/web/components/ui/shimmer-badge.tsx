'use client'

import { motion, useReducedMotion } from 'motion/react'
import { BorderBeam } from './border-beam'
import { cn } from '@/shared/utils'

type ShimmerBadgeProps = {
  label: string
  className?: string
}

export function ShimmerBadge({ label, className }: ShimmerBadgeProps) {
  const prefersReducedMotion = useReducedMotion()

  const badgeAnimation = prefersReducedMotion ? undefined : { y: [0, -5, 0] }
  const dotAnimation = prefersReducedMotion
    ? undefined
    : { opacity: [1, 0.3, 1] }
  const textAnimation = prefersReducedMotion
    ? undefined
    : { backgroundPosition: ['0% 50%', '200% 50%'] }

  return (
    <div>
      <motion.div
        className={cn(
          'border-cg-yellow-200/40 bg-cg-yellow-400/90 relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-4 py-1.5 shadow-lg shadow-black/20 backdrop-blur-sm',
          className
        )}
        whileInView={badgeAnimation}
        viewport={{ margin: '10% 0px' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.span
          className="bg-cg-yellow-200 h-1.5 w-1.5 shrink-0 rounded-full"
          whileInView={dotAnimation}
          viewport={{ margin: '10% 0px' }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="from-cg-yellow-100 to-cg-yellow-100 bg-linear-to-r via-white bg-size-[200%_100%] bg-clip-text font-mono text-[11px] font-semibold tracking-wide text-transparent uppercase"
          whileInView={textAnimation}
          viewport={{ margin: '10% 0px' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        >
          {label}
        </motion.span>
        <BorderBeam
          size={40}
          duration={4}
          borderWidth={1}
          colorFrom="#eab308"
          colorTo="#fde047"
        />
      </motion.div>
    </div>
  )
}

export default ShimmerBadge
