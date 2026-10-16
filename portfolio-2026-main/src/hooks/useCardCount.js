import { useEffect, useState } from 'react'

// Single source of truth for "cards collected": the unlocked cards listed in
// public/data/cards.json (same file the Modifier Deck reads). Returns null until
// loaded so the Metric renders nothing rather than a stale number during fetch.
export function useCardCount() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/data/cards.json')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCount(data?.cards?.length ?? 0)
      })
      .catch(() => {
        if (!cancelled) setCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return count
}
