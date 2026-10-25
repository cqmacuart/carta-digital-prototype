import { AnimatePresence, motion, useTransform, type DragControls, type MotionValue, type Variants } from 'motion/react'
import { ChevronUp, Info } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { money } from '../lib/format'
import type { Category, MenuItem } from '../types'

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
  // the open sheet already lists the variants under "Elige"
  const badgeOpacity = useTransform(open, [0, 0.3], [1, 0])
  const variantCount = item.variants?.length ?? 0
  const accent = { color: category.accent }
  // a lone subcategory would just repeat the category name
  const subName = category.subcategories.length > 1 ? category.subcategories.find((s) => s.id === item.sub)?.name : undefined
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

  // the collapsed sheet shows at most two lines of tagline; warn while editing the menu if one gets cut
  const taglineRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    let live = true
    // measure with the real web font: the fallback is narrower and would hide the overflow
    document.fonts.ready.then(() => {
      const p = taglineRef.current
      if (live && p && p.scrollHeight > p.clientHeight + 1)
        console.warn(`[menu] La frase de "${item.name}" pasa de dos líneas; acórtala en src/data/menu.ts:`, item.tagline)
    })
    return () => {
      live = false
    }
  }, [item])

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
      {/* how many versions the dish comes in, sitting on the sheet's top edge; tapping it opens the list */}
      <div className={`absolute right-6 top-0 z-10 -translate-y-1/2 ${expanded ? 'pointer-events-none' : ''}`}>
        <motion.div style={{ opacity: badgeOpacity }}>
          <AnimatePresence initial={false} mode="popLayout">
            {variantCount > 1 && (
              <motion.button
                key={variantCount}
                type="button"
                onClick={() => !expanded && onToggle()}
                aria-label={`${variantCount} variantes: ver cuáles`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                whileTap={{ scale: 0.9 }}
                className="flex min-h-11 items-center"
              >
                <span className="flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-3 text-[12px] font-bold text-espresso shadow-[0_4px_12px_-4px_rgba(42,26,18,.5)] ring-1 ring-espresso/10">
                  <span
                    className="grid size-[22px] place-items-center rounded-full text-[11px] tabular-nums text-white"
                    style={{ backgroundColor: category.strong }}
                    aria-hidden
                  >
                    {variantCount}
                  </span>
                  <span aria-hidden>variantes</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* drag zone: caret tab + title */}
      <div
        ref={peekRef}
        className="shrink-0 touch-none px-6 pb-[env(safe-area-inset-bottom)]"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 520, damping: 15 }}
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? 'Ocultar descripción' : 'Ver descripción'}
          className="mx-auto flex h-11 w-16 items-center justify-center"
        >
          <motion.span style={{ rotate: caret }} className="grid h-6 w-10 place-items-center rounded-full bg-current/12">
            <ChevronUp size={18} strokeWidth={2.6} aria-hidden />
          </motion.span>
        </motion.button>
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
              {/* category · subcategory · group on one line; the narrowest phones get tighter tracking so it fits */}
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-75 min-[360px]:tracking-[0.22em]">
                {category.name}
                {subName && <span className="opacity-70"> · {subName}</span>}
                {item.group && <span className="opacity-70"> · {item.group}</span>}
              </p>
              <div className="mt-1 flex items-start justify-between gap-4">
                <h1 className="text-balance font-display text-[29px] font-semibold leading-[1.06] tracking-tight">{item.name}</h1>
                <p className="flex shrink-0 flex-col items-end pt-1 text-right" style={accent}>
                  {item.variants && <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">desde</span>}
                  <span className="font-display text-[24px] font-semibold leading-none tabular-nums">{money(item.price)}</span>
                </p>
              </div>
              <p ref={taglineRef} className="mt-2 line-clamp-2 text-[15px] leading-snug opacity-80">
                {item.tagline}
              </p>
              {item.tags && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {item.tags.map(({ id, label, icon: Icon }) => (
                    <span key={id} className={`flex items-center gap-1 px-2.5 py-1 text-[12px] font-bold ${chip}`}>
                      <Icon size={13} strokeWidth={2.4} aria-hidden style={accent} />
                      {label}
                    </span>
                  ))}
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

          {item.variants && (
            <motion.section variants={rise} className="mt-6">
              <h2 className="mb-1 font-display text-lg font-semibold">Elige</h2>
              <ul className="divide-y divide-current/10">
                {item.variants.map((v) => (
                  <li key={v.name} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span className="text-[15px] leading-snug">
                      <span className="font-semibold">{v.name}</span>
                      {v.detail && <span className="block text-[13px] opacity-75">{v.detail}</span>}
                    </span>
                    <span className="shrink-0 font-display text-[17px] font-semibold tabular-nums" style={accent}>
                      {money(v.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {item.toppings && (
            <motion.section variants={rise} className="mt-6">
              <h2 className="mb-2.5 font-display text-lg font-semibold">
                Incluye {item.toppings.count} {item.toppings.count === 1 ? 'topping' : 'toppings'}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {item.toppings.options.map((t) => (
                  <li key={t} className={`px-3 py-1.5 text-[13px] font-semibold ${chip}`}>
                    {t}
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {item.modifiers && (
            <motion.section variants={rise} className="mt-6">
              <h2 className="mb-1 font-display text-lg font-semibold">Adiciones</h2>
              <ul className="divide-y divide-current/10">
                {item.modifiers.map((m) => (
                  <li key={m.name} className="flex items-baseline justify-between gap-4 py-2.5 text-[15px]">
                    <span className="font-semibold">{m.name}</span>
                    <span className="shrink-0 font-display text-[17px] font-semibold tabular-nums" style={accent}>
                      +{money(m.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

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
