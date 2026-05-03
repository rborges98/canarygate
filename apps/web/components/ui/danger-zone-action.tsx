'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/shared/utils'

type DangerZoneActionProps = {
  title: string
  description: string
  actionLabel: string
  onAction?: () => boolean | void | Promise<boolean | void>
  confirmTitle?: string
  confirmDescription?: string
  confirmLabel?: string
  cancelLabel?: string
  isPending?: boolean
  className?: string
}

export function DangerZoneAction({
  title,
  description,
  actionLabel,
  onAction,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  cancelLabel = 'Cancel',
  isPending = false,
  className
}: DangerZoneActionProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const isBusy = isPending || isConfirming

  const handleClose = () => {
    if (isBusy) {
      return
    }

    setIsConfirmOpen(false)
  }

  const handleConfirm = async () => {
    if (!onAction || isBusy) {
      return
    }

    setIsConfirming(true)

    try {
      const result = await onAction()

      if (result !== false) {
        setIsConfirmOpen(false)
      }
    } catch (error) {
      console.error('[DangerZoneAction] Failed:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
          className
        )}
      >
        <div className="min-w-0">
          <h3 className="text-cg-red-100 mb-1 text-[13px] font-semibold">
            {title}
          </h3>
          <p className="text-cg-neutral-300 max-w-[56ch] text-[11px] leading-5">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={!onAction || isBusy}
          className="border-cg-red-200 bg-cg-red-300 text-cg-red-100 hover:bg-cg-red-200 w-fit shrink-0 rounded-lg border px-4 py-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>
      </div>

      <Modal open={isConfirmOpen} onClose={handleClose}>
        <div className="border-cg-bg-100 border-b px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="border-cg-red-200 bg-cg-red-300 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
              <span className="text-cg-red-100 text-[16px] font-bold">!</span>
            </div>
            <div>
              <h3 className="mb-1 text-[15px] font-bold text-white">
                {confirmTitle ?? `${title}?`}
              </h3>
              <p className="text-cg-neutral-300 text-[12px] leading-5">
                {confirmDescription ?? description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-6">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!onAction || isBusy}
            className="border-cg-red-200 bg-cg-red-300 text-cg-red-100 hover:bg-cg-red-200 flex-1 rounded-lg border py-2.5 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? 'Working...' : (confirmLabel ?? actionLabel)}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="border-cg-bg-100 bg-cg-bg-100 text-cg-neutral-300 flex-1 rounded-lg border py-2.5 text-[12px] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </Modal>
    </>
  )
}
