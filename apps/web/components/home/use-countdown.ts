import { useEffect, useState } from 'react'

export type Countdown = {
  d: number
  h: number
  m: number
  s: number
}

export function useCountdown(target: Date): Countdown {
  const [remaining, setRemaining] = useState<Countdown>({
    d: 0,
    h: 0,
    m: 0,
    s: 0
  })

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, target.getTime() - Date.now())
      setRemaining({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000)
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return remaining
}
