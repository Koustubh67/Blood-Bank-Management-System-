import { useEffect, useState } from 'react'

/**
 * Returns the id of the first section currently in the reading band near the
 * top of the viewport. Used for "On this page" highlighting.
 */
export function useScrollSpy(ids: string[], topOffset = 110) {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')

  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    if (!els.length || typeof IntersectionObserver === 'undefined') return
    const visible = new Set<string>()
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id)
          else visible.delete(e.target.id)
        }
        const first = ids.find((id) => visible.has(id))
        if (first) setActive(first)
      },
      { rootMargin: `-${topOffset}px 0px -55% 0px` },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, topOffset])

  return active && ids.includes(active) ? active : (ids[0] ?? null)
}
