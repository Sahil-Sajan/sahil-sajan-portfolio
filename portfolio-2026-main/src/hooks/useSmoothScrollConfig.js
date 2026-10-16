import { useEffect, useState } from 'react'

export function useSmoothScrollConfig() {
  const [options, setOptions] = useState({
    duration: 2,
    smoothWheel: true,
    syncTouch: true,
  })

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (prefersReducedMotion) {
      setOptions({ duration: 0 })
    } else if (isMobile) {
      setOptions({
        duration: 2,
        smoothWheel: true,
        // syncTouch: true,
        // syncTouchLerp: 0.075,
        // touchMultiplier: 1.5,
      })
    } else {
      setOptions({
        duration: 2,
        smoothWheel: true,
        syncTouch: true,
      })
    }
  }, [])

  return options
}
