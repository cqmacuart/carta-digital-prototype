import { AnimatePresence, motion, useTransform, type DragControls, type MotionValue, type Variants } from 'motion/react'
import { ChevronUp, Info, Leaf, Flame, Sparkles, Sprout, Star, WheatOff, type LucideIcon } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { money } from '../lib/format'
import type { Category, MenuItem, Tag } from '../types'

const TAGS: Record<Tag, { label: string; icon: LucideIcon }> = {
  casa: { label: 'De la casa', icon: Star },
  nuevo: { label: 'Nuevo', icon: Sparkles },
  vegano: { label: 'Vegano', icon: Leaf },
  vegetariano: { label: 'Vegetariano', icon: Sprout },
  'sin-gluten': { label: 'Sin gluten', icon: WheatOff },
  picante: { label: 'Picante', icon: Flame },
}

type Props = {
  item: MenuItem
  category: Category
  direction: number
  /** 'x' when the dish changed, 'y' when the category changed */
  axis: 'x' | 'y'
  expanded: boolean
  open: MotionValue<number>
  dragControls: DragControls
  onToggle: () => void
  /** Height of the always-visible part, so the collapsed sheet hugs its content. */
  onPeekHeight: (h: number) => void
}

type Swap = { dir: number; axis: 'x' | 'y' }
const offset = ({ dir, axis }: Swap, d: number) => (axis === 'x' ? { x: dir * d, y: 0 } : { x: 0, y: dir * d })
const swap: Variants = {
  enter: (s: Swap) => ({ ...offset(s, 36), opacity: 0 }),
  center: { x: 0, y: 0, opacity: 1 },
  exit: (s: Swap) => ({ ...offset(s, -36), opacity: 0, transition: { duration: 0.14 } }),
}

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
}

/** Soft chip tinted from the sheet's own text colour, so it works on light and dark sheets alike. */
const chip = 'rounded-full bg-current/10 ring-1 ring-current/15'

export function DishSheet({ item, category, direction, axis, expanded, open, dragControls, onToggle, onPeekHeight }: Props) {
  const bodyOpacity = useTransform(open, [0.05, 0.45], [0, 1])
  const caret = useTransform(open, [0, 1], [0, 180])
  const accent = { color: category.accent }
  const custom: Swap = { dir: direction, axis }

  const peekRef = useRef<HTMLDivElement>(null)
  const report = useRef(onPeekHeight)
  useEffect(() => {
    report.current = onPeekHeight
  })
  useLayoutEffect(() => {
    const el = peekRef.current
    if (!el) return
    const ro = new ResizeObserver(() => report.current(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // does the description need its own scroll?
  const bodyRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)
  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    const ro = new ResizeObserver(check)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [])

  // scrollable body: pulling down while already at the top drags the sheet instead of scrolling
  const downEvent = useRef<PointerEvent | null>(null)
  const controls = useRef(dragControls)
  useEffect(() => {
    controls.current = dragControls
  })
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    let startY = 0
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
    }
    const onMove = (e: TouchEvent) => {
      const down = downEvent.current
      if (!down) return
      if (e.touches[0].clientY - startY > 6 && el.scrollTop <= 0) {
        e.preventDefault()
        downEvent.current = null
        controls.current.start(down)
      } else if (Math.abs(e.touches[0].clientY - startY) > 6) downEvent.current = null
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* drag zone: caret tab + title */}
      <div
        ref={peekRef}
        className="shrink-0 touch-none px-6 pb-[env(safe-area-inset-bottom)]"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? 'Ocultar descripción' : 'Ver descripción'}
          className="mx-auto flex h-11 w-16 items-center justify-center"
        >
          <motion.span style={{ rotate: caret }} className="grid h-6 w-10 place-items-center rounded-full bg-current/12">
            <ChevronUp size={18} strokeWidth={2.6} aria-hidden />
          </motion.span>
        </button>
        <div className="relative pb-5">
          <AnimatePresence mode="popLayout" initial={false} custom={custom}>
            <motion.div
              key={item.id}
              custom={custom}
              variants={swap}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="w-full"
              style={{ color: category.ink }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-75">{category.name}</p>
              <div className="mt-1 flex items-start justify-between gap-4">
                <h1 className="text-balance font-display text-[29px] font-semibold leading-[1.06] tracking-tight">{item.name}</h1>
                <p className="shrink-0 pt-1 font-display text-[24px] font-semibold tabular-nums" style={accent}>
                  {money(item.price)}
                </p>
              </div>
              <p className="mt-2 line-clamp-2 text-[15px] leading-snug opacity-80">{item.tagline}</p>
              {item.tags && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {item.tags.map((t) => {
                    const { label, icon: Icon } = TAGS[t]
                    return (
                      <span key={t} className={`flex items-center gap-1 px-2.5 py-1 text-[12px] font-bold ${chip}`}>
                        <Icon size={13} strokeWidth={2.4} aria-hidden style={accent} />
                        {label}
                      </span>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* description body: drags the sheet; only scrolls natively when it doesn't fit */}
      <motion.div
        ref={bodyRef}
        style={{ opacity: bodyOpacity }}
        onPointerDown={(e) => {
          // a short body (or a mouse) drags straight away; a scrollable one hands over on pull-down at the top
          if (!overflows || e.pointerType === 'mouse') dragControls.start(e)
          else downEvent.current = e.nativeEvent
        }}
        className={`no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(24px,env(safe-area-inset-bottom))] ${
          overflows ? 'touch-pan-y' : 'touch-none'
        }`}
      >
        <motion.div key={item.id} variants={list} initial="hidden" animate={expanded ? 'show' : 'hidden'}>
          <motion.div variants={rise} className="h-px bg-current/15" />
          <motion.p variants={rise} className="pt-5 text-[16px] leading-relaxed opacity-90">
            {item.description}
          </motion.p>

          {item.ingredients && (
            <motion.section variants={rise} className="mt-6">
              <h2 className="mb-2.5 font-display text-lg font-semibold">Ingredientes</h2>
              <ul className="flex flex-wrap gap-2">
                {item.ingredients.map((ing) => (
                  <li key={ing} className={`px-3.5 py-2 text-[14px] font-semibold ${chip}`}>
                    {ing}
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {item.note && (
            <motion.p
              variants={rise}
              className="mt-6 flex items-start gap-2.5 rounded-2xl bg-current/8 px-4 py-3 text-[14px] font-semibold leading-snug"
            >
              <Info size={17} strokeWidth={2.4} aria-hidden className="mt-px shrink-0" style={accent} />
              {item.note}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
