'use client'

import { cn } from '@/shared/utils'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className={cn(
          'border-cg-indigo-600 bg-cg-bg-300 mx-4 w-full max-w-[360px] overflow-hidden rounded-2xl border shadow-[0_24px_60px_rgba(0,0,0,0.6)]',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export default Modal
