import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useTransform } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, MENU, itemsOf } from '../data/menu'
import { clamp } from '../lib/format'
import { CategoryCarousel, type CarouselApi } from './RadialCarousel'
import { DishSheet } from './DishSheet'

const HEADER = 68
const CHIPS = 52
/** Typical collapsed-sheet height, used to lay out the stage so the plate never jumps between dishes. */
const PEEK = 190
/** Breathing room under the collapsed sheet's content. */
const PEEK_PAD = 6

/** Static paper grain: drawn once, never animated. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .2 0 0 0 0 .12 0 0 0 0 .08 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

type Props = { width: number; height: number }

export function MenuScreen({ width, height }: Props) {
  // ---- geometry -----------------------------------------------------------
  const stageTop = HEADER + CHIPS
  const stageH = Math.max(240, height - stageTop - PEEK + 28)
  const size = Math.min(stageH * 0.66, width * 0.72, 310)
  const radius = width * 0.86
  const openTop = Math.round(height * 0.3)
  const sheetH = height - openTop
  const [peek, setPeek] = useState(PEEK)
  const collapsedY = sheetH - peek - PEEK_PAD
  const plateCenter = stageTop + stageH / 2
  const shift = (HEADER + openTop) / 2 + 6 - plateCenter
  // like the reference: the blurred surface ends exactly at the plate's equator
  const backdropH = plateCenter

  // ---- category + dish ----------------------------------------------------
  const [catIndex, setCatIndex] = useState(0)
  const [entry, setEntry] = useState<{ at: number; from: 1 | -1 }>({ at: 0, from: 1 })
  const [nav, setNav] = useState({ index: 0, direction: 1 })
  const exitDirRef = useRef<1 | -1>(1)
  const apiRef = useRef<CarouselApi | null>(null)
  const [backdropEl, setBackdropEl] = useState<HTMLDivElement | null>(null)
  const category = CATEGORIES[catIndex]
  const items = useMemo(() => itemsOf(category.id), [category.id])
  const item = items[clamp(nav.index, 0, items.length - 1)]

  const switchCategory = (next: number, dir: 1 | -1, landAtEnd = false) => {
    if (next < 0 || next >= CATEGORIES.length) return false
    const at = landAtEnd ? itemsOf(CATEGORIES[next].id).length - 1 : 0
    exitDirRef.current = dir
    setEntry({ at, from: dir })
    setCatIndex(next)
    setNav({ index: at, direction: dir })
    return true
  }

  // warm the cache so switching categories never waits on the network
  useEffect(() => {
    const t = setTimeout(() => MENU.forEach((m) => (new Image().src = m.img)), 1200)
    return () => clearTimeout(t)
  }, [])

  // keep the active chip in view (scroll only the chip rail, never the page)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const railRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const chip = chipRefs.current[catIndex]
    const rail = railRef.current
    if (!chip || !rail) return
    rail.scrollTo({ left: chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [catIndex])

  // ---- sheet --------------------------------------------------------------
  const dragControls = useDragControls()
  const sheetY = useMotionValue(collapsedY)
  const collapsedRef = useRef(collapsedY)
  const shiftRef = useRef(shift)
  const [isOpen, setOpen] = useState(false)
  const openRef = useRef(false)
  const placed = useRef(false)
  useEffect(() => {
    collapsedRef.current = collapsedY
    shiftRef.current = shift
    if (openRef.current) return
    // first layout jumps into place; later content changes glide the sheet to hug the new dish
    if (placed.current) animate(sheetY, collapsedY, { type: 'spring', stiffness: 320, damping: 34 })
    else sheetY.set(collapsedY)
    placed.current = true
  }, [collapsedY, shift, sheetY])
  const open = useTransform(sheetY, (v) => clamp(1 - v / collapsedRef.current, 0, 1))
  const snap = (toOpen: boolean) => {
    openRef.current = toOpen
    setOpen(toOpen)
    animate(sheetY, toOpen ? 0 : collapsedRef.current, { type: 'spring', stiffness: 300, damping: 36 })
  }

  const stageY = useTransform(open, (o) => o * shiftRef.current)
  const stageScale = useTransform(open, [0, 1], [1, 0.6])
  const chipsOpacity = useTransform(open, [0, 0.4], [1, 0])

  // stable callbacks keep the memoised carousel from re-rendering on every dish change
  const latest = useRef({ switchCategory, catIndex, snap })
  useEffect(() => {
    latest.current = { switchCategory, catIndex, snap }
  })
  const onIndex = useCallback((index: number, direction: 1 | -1) => setNav({ index, direction }), [])
  const onOverflow = useCallback((dir: 1 | -1) => {
    const { switchCategory, catIndex } = latest.current
    return switchCategory(catIndex + dir, dir, dir < 0)
  }, [])
  const onTapLocked = useCallback(() => latest.current.snap(false), [])

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      animate={{ backgroundColor: category.bg }}
      transition={{ duration: 0.6 }}
    >
      {/* the dish itself, big and out of focus, as the surface behind the top third */}
      <div
        ref={setBackdropEl}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
        style={{
          height: backdropH,
          maskImage: 'linear-gradient(to bottom, #000 calc(100% - 18px), transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 calc(100% - 18px), transparent)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.22]" style={{ backgroundImage: GRAIN }} />

      {/* header */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4" style={{ height: HEADER }}>
        <div className="flex items-center gap-2 rounded-full bg-white/70 py-1 pl-1 pr-4 ring-1 ring-white/80">
          <span className="grid size-9 place-items-center rounded-full bg-espresso font-display text-base font-semibold italic text-cream">
            t
          </span>
          <div className="leading-none">
            <p className="font-display text-[19px] font-semibold tracking-tight">Terra</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-cocoa">café · cocina</p>
          </div>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-2 text-[12px] font-bold text-espresso ring-1 ring-white/70 backdrop-blur-md">
          <span className="size-2 rounded-full bg-olive" aria-hidden />
          Abierto · hasta 22:00
        </p>
      </header>

      {/* category chips */}
      <motion.nav
        aria-label="Categorías"
        style={{ top: HEADER, height: CHIPS, opacity: chipsOpacity }}
        className="absolute inset-x-0 z-30 flex items-center px-4"
      >
        <div
          ref={railRef}
          className="no-scrollbar relative mx-auto flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-white/70 p-1 ring-1 ring-white/80"
        >
          {CATEGORIES.map((c, i) => {
            const active = i === catIndex
            return (
              <button
                key={c.id}
                ref={(el) => {
                  chipRefs.current[i] = el
                }}
                type="button"
                aria-current={active}
                onClick={() => i !== catIndex && switchCategory(i, i > catIndex ? 1 : -1)}
                className={`relative min-h-10 shrink-0 rounded-full px-3 text-[13px] font-bold transition-colors duration-300 ${
                  active ? '' : 'text-cocoa'
                }`}
                style={active ? { color: c.ink } : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="chip"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: c.sheet }}
                  />
                )}
                <span className="relative">{c.name}</span>
              </button>
            )
          })}
        </div>
      </motion.nav>

      {/* stage: swipe, tap a side plate, or use ← → */}
      <motion.div
        role="region"
        aria-roledescription="carrusel"
        aria-label={`${category.name}: ${item.name}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') apiRef.current?.step(1)
          if (e.key === 'ArrowLeft') apiRef.current?.step(-1)
        }}
        className="absolute inset-x-0 z-10 select-none outline-none"
        style={{ top: stageTop, height: stageH, y: stageY, scale: stageScale, willChange: 'transform' }}
      >
        <AnimatePresence initial={false}>
          <CategoryCarousel
            key={category.id}
            items={items}
            size={size}
            radius={radius}
            width={width}
            backdropEl={backdropEl}
            stepPx={width * 0.65}
            open={open}
            lockedRef={openRef}
            startAt={entry.at}
            enterFrom={entry.from}
            exitDirRef={exitDirRef}
            apiRef={apiRef}
            onIndex={onIndex}
            onOverflow={onOverflow}
            onTapLocked={onTapLocked}
          />
        </AnimatePresence>
      </motion.div>

      {/* dish sheet, wearing the category's colour */}
      <motion.section
        aria-label="Descripción del plato"
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: collapsedY }}
        dragElastic={0.06}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const v = info.velocity.y
          snap(v < -300 || (v < 300 && sheetY.get() < collapsedRef.current / 2))
        }}
        animate={{ backgroundColor: category.sheet, color: category.ink }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ y: sheetY, height: sheetH }}
        className="absolute inset-x-0 bottom-0 z-20 rounded-t-[36px] shadow-[0_-10px_28px_-6px_rgba(42,26,18,.32),0_-2px_6px_rgba(42,26,18,.12),inset_0_1px_0_rgba(255,255,255,.22)]"
      >
        <DishSheet
          item={item}
          category={category}
          direction={nav.direction}
          expanded={isOpen}
          open={open}
          dragControls={dragControls}
          onToggle={() => snap(!openRef.current)}
          onPeekHeight={setPeek}
        />
      </motion.section>
    </motion.div>
  )
}
