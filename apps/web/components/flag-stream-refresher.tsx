'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function FlagStreamRefresher() {
  const router = useRouter()

  useEffect(() => {
    const eventSource = new EventSource('/api/flags/stream')

    const handleFlagEvent = () => {
      router.refresh()
    }

    eventSource.addEventListener('flag-updated', handleFlagEvent)
    eventSource.addEventListener('flag-deleted', handleFlagEvent)

    return () => {
      eventSource.close()
    }
  }, [router])

  return null
}
