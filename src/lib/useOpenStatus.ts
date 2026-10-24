import { useEffect, useMemo, useState } from 'react'
import type { OpeningHours } from '../models/db'
import { openStatus } from './hours'

/** Open/closed label for the branch, refreshed at the start of every minute. */
export function useOpenStatus(hours: OpeningHours[], timezone: string) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(new Date())
      t = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    }
    t = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    return () => clearTimeout(t)
  }, [])
  // the screen re-renders on every dish change; the status only needs recomputing once a minute
  return useMemo(() => openStatus(hours, timezone, now), [hours, timezone, now])
}
