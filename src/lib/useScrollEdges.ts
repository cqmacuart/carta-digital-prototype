import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Is there more to scroll towards the start / end of this container? Updates on scroll and resize;
 * `watch` re-measures when the content changes (e.g. another category's chips).
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>, axis: 'x' | 'y', watch?: unknown) {
  const [edges, setEdges] = useState({ start: false, end: false, overflow: false })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // content size from the children's layout boxes: scrollWidth also counts transforms, so a sliding
    // or overshooting active pill would read as overflow (and nothing re-measures once it settles)
    const contentSize = () => {
      const first = el.firstElementChild as HTMLElement | null
      const last = el.lastElementChild as HTMLElement | null
      if (!first || !last) return 0
      const cs = getComputedStyle(el)
      return axis === 'x'
        ? last.offsetLeft + last.offsetWidth - first.offsetLeft + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
        : last.offsetTop + last.offsetHeight - first.offsetTop + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    }
    const update = () => {
      const pos = axis === 'x' ? el.scrollLeft : el.scrollTop
      const max = contentSize() - (axis === 'x' ? el.clientWidth : el.clientHeight)
      const next = { start: pos > 2, end: pos < max - 2, overflow: max > 2 }
      setEdges((e) => (e.start === next.start && e.end === next.end && e.overflow === next.overflow ? e : next))
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
