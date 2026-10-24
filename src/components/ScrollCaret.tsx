import { motion } from 'motion/react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { useScrollEdges } from '../lib/useScrollEdges'

type Axis = 'x' | 'y'

const ICONS = { x: [ChevronLeft, ChevronRight], y: [ChevronUp, ChevronDown] } as const

/**
 * A scroller with its own caret slots: only when the content overflows, a caret sits before and after it
 * (never on top of the items). The caret at an edge already reached dims; the other pulses.
 */
export function ScrollStrip({
  axis,
  scrollRef,
  watch,
  labels,
  className = '',
  scrollerClassName = '',
  scrollerStyle,
  children,
}: {
  axis: Axis
  scrollRef: RefObject<HTMLDivElement | null>
  /** re-measure when this changes (e.g. the category whose chips are shown) */
  watch?: unknown
  labels: [start: string, end: string]
  className?: string
  scrollerClassName?: string
  scrollerStyle?: CSSProperties
  children: ReactNode
}) {
  const edges = useScrollEdges(scrollRef, axis, watch)
  const flow = axis === 'x' ? 'flex-row' : 'flex-col'
  const overflow = axis === 'x' ? 'overflow-x-auto' : 'overflow-y-auto overscroll-contain'
  // items that continue past an edge fade out there instead of being cut
  const fade = `linear-gradient(to ${axis === 'x' ? 'right' : 'bottom'}, ${edges.start ? 'transparent' : '#000'} 0, #000 14px, #000 calc(100% - 14px), ${edges.end ? 'transparent' : '#000'} 100%)`
  return (
    <div className={`flex ${flow} items-center ${className}`}>
      {edges.overflow && <Caret axis={axis} side="start" active={edges.start} label={labels[0]} target={scrollRef} />}
      <div
        ref={scrollRef}
        className={`no-scrollbar flex ${flow} min-h-0 min-w-0 ${overflow} ${scrollerClassName}`}
        style={{ ...scrollerStyle, maskImage: fade, WebkitMaskImage: fade }}
      >
        {children}
      </div>
      {edges.overflow && <Caret axis={axis} side="end" active={edges.end} label={labels[1]} target={scrollRef} />}
    </div>
  )
}

function Caret({
  axis,
  side,
  active,
  label,
  target,
}: {
  axis: Axis
  side: 'start' | 'end'
  active: boolean
  label: string
  target: RefObject<HTMLDivElement | null>
}) {
  const Icon = ICONS[axis][side === 'start' ? 0 : 1]
  const scroll = () => {
    const el = target.current
    if (!el) return
    const page = (axis === 'x' ? el.clientWidth : el.clientHeight) * 0.6 * (side === 'start' ? -1 : 1)
    el.scrollBy(axis === 'x' ? { left: page, behavior: 'smooth' } : { top: page, behavior: 'smooth' })
  }
  return (
    <button
      type="button"
      aria-label={label}
      disabled={!active}
      onClick={scroll}
      className="grid size-7 shrink-0 place-items-center rounded-full text-espresso transition-opacity duration-200 disabled:opacity-25"
    >
      <motion.span
        aria-hidden
        animate={active ? { opacity: [0.45, 1, 0.45], [axis]: side === 'start' ? [0, -2, 0] : [0, 2, 0] } : { opacity: 1, x: 0, y: 0 }}
        transition={active ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <Icon size={16} strokeWidth={2.6} />
      </motion.span>
    </button>
  )
}
