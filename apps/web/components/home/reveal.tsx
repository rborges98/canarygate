'use client'

import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/shared/utils'

type RevealProps = {
  children: React.ReactNode
  delay?: number
  y?: number
  blur?: number
  scale?: number
  className?: string
}

export function Reveal({
  children,
  delay = 0,
  y = 28,
  blur = 6,
  scale,
  className
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y,
              filter: `blur(${blur}px)`,
              ...(scale !== undefined ? { scale } : {})
            }
      }
      whileInView={
        prefersReducedMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              ...(scale !== undefined ? { scale: 1 } : {})
            }
      }
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        type: prefersReducedMotion ? 'tween' : 'spring',
        stiffness: 80,
        damping: 18,
        duration: prefersReducedMotion ? 0.35 : undefined,
        delay
      }}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
