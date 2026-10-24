import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Is there more to scroll towards the start / end of this container? Updates on scroll and resize;
 * `watch` re-measures when the content changes (e.g. another category's chips).
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>, axis: 'x' | 'y', watch?: unknown) {
  const [edges, setEdges] = useState({ start: false, end: false })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const pos = axis === 'x' ? el.scrollLeft : el.scrollTop
      const max = axis === 'x' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight
      const next = { start: pos > 2, end: pos < max - 2 }
      setEdges((e) => (e.start === next.start && e.end === next.end ? e : next))
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [ref, axis, watch])
  return edges
}
