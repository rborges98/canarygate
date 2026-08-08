'use client'

import { motion } from 'motion/react'
import { BorderBeam } from './border-beam'
import { cn } from '@/shared/utils'

type ShimmerBadgeProps = {
  label: string
  className?: string
}

export function ShimmerBadge({ label, className }: ShimmerBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        className={cn(
          'border-cg-yellow-200/40 bg-cg-yellow-400/90 relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-4 py-1.5 shadow-lg shadow-black/20 backdrop-blur-sm',
          className
        )}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.span
          className="bg-cg-yellow-200 h-1.5 w-1.5 shrink-0 rounded-full"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="from-cg-yellow-100 to-cg-yellow-100 bg-linear-to-r via-white bg-size-[200%_100%] bg-clip-text font-mono text-[11px] font-semibold tracking-wide text-transparent uppercase"
          animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
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
    </motion.div>
  )
}

export default ShimmerBadge
