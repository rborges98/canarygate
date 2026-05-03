'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--color-cg-bg-200)',
          border: '1px solid var(--color-cg-bg-100)',
          color: '#ebebeb',
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          borderRadius: '10px'
        }
      }}
    />
  )
}
