import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import type { RefObject } from 'react'

type Axis = 'x' | 'y'

const ICONS = { x: [ChevronLeft, ChevronRight], y: [ChevronUp, ChevronDown] } as const

/** A small pulsing caret at one edge of a scroller; tapping it scrolls a page that way. */
export function ScrollCaret({
  target,
  axis,
  side,
  show,
  label,
  className = '',
}: {
  target: RefObject<HTMLElement | null>
  axis: Axis
  side: 'start' | 'end'
  show: boolean
  label: string
  className?: string
}) {
  const Icon = ICONS[axis][side === 'start' ? 0 : 1]
  const scroll = () => {
    const el = target.current
    if (!el) return
    const page = (axis === 'x' ? el.clientWidth : el.clientHeight) * 0.6 * (side === 'start' ? -1 : 1)
    el.scrollBy(axis === 'x' ? { left: page, behavior: 'smooth' } : { top: page, behavior: 'smooth' })
  }
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          aria-label={label}
          onClick={scroll}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
          className={`absolute z-10 grid size-7 place-items-center rounded-full bg-white/90 text-espresso shadow-[0_2px_8px_-2px_rgba(42,26,18,.35)] ${className}`}
        >
          <motion.span
            aria-hidden
            animate={{ opacity: [0.45, 1, 0.45], [axis]: side === 'start' ? [0, -2, 0] : [0, 2, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon size={16} strokeWidth={2.6} />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
