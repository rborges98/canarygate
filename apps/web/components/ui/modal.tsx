'use client'

import { useEffect, useId, useRef } from 'react'
import { cn } from '@/shared/utils'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

export function Modal({
  open,
  onClose,
  children,
  className,
  title,
  description
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      triggerRef.current = document.activeElement as HTMLElement | null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleClose() {
    onClose()
    triggerRef.current?.focus()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      aria-describedby={description ? descriptionId : undefined}
      className="bg-transparent p-4 backdrop:bg-black/55"
      onCancel={(e) => {
        e.preventDefault()
        handleClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          handleClose()
        }
      }}
    >
      {description && (
        <p id={descriptionId} className="sr-only">
          {description}
        </p>
      )}
      <div
        className={cn(
          'border-cg-indigo-600 bg-cg-bg-300 mx-4 w-full max-w-[360px] overflow-hidden rounded-2xl border shadow-[0_24px_60px_rgba(0,0,0,0.6)]',
          className
        )}
      >
        {children}
      </div>
    </dialog>
  )
}

export default Modal