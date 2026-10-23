import { animate, motion, useDragControls, useMotionValue, useTransform } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CATEGORIES, MENU, itemsOf } from '../data/menu'
import { clamp } from '../lib/format'
import { CategoryScene, type CarouselApi } from './RadialCarousel'
import { DishSheet } from './DishSheet'

const HEADER = 68
const CHIPS = 52
/** Typical collapsed-sheet height, used to lay out the stage so the plate never jumps between dishes. */
const PEEK = 190
/** Breathing room under the collapsed sheet's content. */
const PEEK_PAD = 6
/** Tallest a collapsed sheet can get; the stage only reacts once the sheet rises above this, so it never moves between dishes. */
const MAX_PEEK = 290
const PAGE_SPRING = { type: 'spring', stiffness: 230, damping: 30, mass: 0.9 } as const

/** Static paper grain: drawn once, never animated. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .2 0 0 0 0 .12 0 0 0 0 .08 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const ITEMS = CATEGORIES.map((c) => itemsOf(c.id))

type Props = { width: number; height: number }

/** One category's place on the vertical track. (No group opacity here: fading a stack of layers costs a render surface per frame.) */
function SceneSlot({ index, pitch, height, children }: { index: number; pitch: number; height: number; children: ReactNode }) {
  return (
    <div className="absolute inset-x-0" style={{ top: index * pitch, height }}>
      {children}
    </div>
  )
}

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
  // vertical distance between category scenes: the next one waits just behind the sheet
  const pitch = height - PEEK + 40

  // ---- category + dish ----------------------------------------------------
  const [catIndex, setCatIndex] = useState(0)
  const [nav, setNav] = useState({ index: 0, direction: 1, axis: 'x' as 'x' | 'y' })
  const dishOf = useRef(CATEGORIES.map(() => 0))
  const apis = useRef<(CarouselApi | null)[]>([])
  const category = CATEGORIES[catIndex]
  const item = ITEMS[catIndex][clamp(nav.index, 0, ITEMS[catIndex].length - 1)]

  // categories are stacked vertically; switching is a single translate of the whole track
  const trackY = useMotionValue(0)
  const catRef = useRef(0)
  const switchCategory = (next: number, dir: 1 | -1, land?: 'start' | 'end') => {
    if (next < 0 || next >= CATEGORIES.length) return false
    if (land) {
      const at = land === 'end' ? ITEMS[next].length - 1 : 0
      apis.current[next]?.jump(at)
      dishOf.current[next] = at
    }
    catRef.current = next
    setCatIndex(next)
    setNav({ index: dishOf.current[next], direction: dir, axis: 'y' })
    animate(trackY, -next * pitch, PAGE_SPRING)
    return true
  }
  useEffect(() => {
    trackY.set(-catRef.current * pitch)
  }, [pitch, trackY])

  // decode every photo ahead of time so nothing is decoded mid-transition
  useEffect(() => {
    const t = setTimeout(() => {
      for (const m of MENU)
        for (const src of [m.img, m.imgBlur, m.imgBack]) {
          const im = new Image()
          im.src = src
          im.decode().catch(() => {})
        }
    }, 900)
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
  // measured against a fixed reference, not the current dish's collapsed position
  const openStart = sheetH - MAX_PEEK - PEEK_PAD
  const openStartRef = useRef(openStart)
  useEffect(() => {
    openStartRef.current = openStart
  }, [openStart])
  const open = useTransform(sheetY, (v) => clamp(1 - v / openStartRef.current, 0, 1))
  const snap = (toOpen: boolean) => {
    openRef.current = toOpen
    setOpen(toOpen)
    animate(sheetY, toOpen ? 0 : collapsedRef.current, { type: 'spring', stiffness: 300, damping: 36 })
  }

  const stageY = useTransform(open, (o) => o * shiftRef.current)
  const stageScale = useTransform(open, [0, 1], [1, 0.6])
  const chipsOpacity = useTransform(open, [0, 0.4], [1, 0])

  // stable callbacks keep the memoised scenes from re-rendering on every dish change
  const latest = useRef({ switchCategory })
  useEffect(() => {
    latest.current = { switchCategory }
  })
  const onIndex = useCallback((cat: number, index: number, direction: 1 | -1) => {
    dishOf.current[cat] = index
    if (cat === catRef.current) setNav({ index, direction, axis: 'x' })
  }, [])
  const register = useCallback((cat: number, api: CarouselApi) => {
    apis.current[cat] = api
  }, [])
  const onOverflow = useCallback(
    (dir: 1 | -1) => latest.current.switchCategory(catRef.current + dir, dir, dir > 0 ? 'start' : 'end'),
    [],
  )

  // ---- gestures: horizontal = dishes, vertical = categories -----------------
  const axis = useRef<'x' | 'y' | null>(null)
  const active = () => apis.current[catRef.current]
  const pageRubber = (dy: number) => {
    const c = catRef.current
    const atEdge = (dy > 0 && c === 0) || (dy < 0 && c === CATEGORIES.length - 1)
    return atEdge ? dy * 0.25 : dy
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#F1E6DA]">
      {/* category track */}
      <motion.div
        className="absolute inset-x-0 top-0"
        style={{ y: trackY, height: pitch * (CATEGORIES.length - 1) + height, touchAction: 'none', willChange: 'transform' }}
        onPanStart={(_, info) => {
          if (openRef.current) return
          axis.current = Math.abs(info.offset.x) >= Math.abs(info.offset.y) ? 'x' : 'y'
          if (axis.current === 'x') active()?.panStart()
          else trackY.stop()
        }}
        onPan={(_, info) => {
          if (openRef.current || !axis.current) return
          if (axis.current === 'x') active()?.pan(info.offset.x)
          else trackY.set(-catRef.current * pitch + pageRubber(info.offset.y))
        }}
        onPanEnd={(_, info) => {
          if (openRef.current || !axis.current) return
          if (axis.current === 'x') active()?.panEnd(info.velocity.x)
          else {
            const { y } = info.offset
            const v = info.velocity.y
            const dir = y < -70 || v < -500 ? 1 : y > 70 || v > 500 ? -1 : 0
            if (!dir || !switchCategory(catRef.current + dir, dir)) animate(trackY, -catRef.current * pitch, PAGE_SPRING)
          }
          axis.current = null
        }}
        onClick={() => {
          if (openRef.current) snap(false)
        }}
      >
        {CATEGORIES.map((c, ci) => (
          <SceneSlot key={c.id} index={ci} pitch={pitch} height={height}>
            <CategoryScene
              catIndex={ci}
              items={ITEMS[ci]}
              width={width}
              stageTop={stageTop}
              stageH={stageH}
              backdropH={plateCenter}
              size={size}
              radius={radius}
              stepPx={width * 0.65}
              open={open}
              stageY={stageY}
              stageScale={stageScale}
              lockedRef={openRef}
              register={register}
              onIndex={onIndex}
              onOverflow={onOverflow}
            />
          </SceneSlot>
        ))}
      </motion.div>

      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.22]" style={{ backgroundImage: GRAIN }} />

      {/* keyboard: ← → dishes, ↑ ↓ categories */}
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label={`${category.name}: ${item.name}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') active()?.step(1)
          if (e.key === 'ArrowLeft') active()?.step(-1)
          if (e.key === 'ArrowDown') switchCategory(catRef.current + 1, 1)
          if (e.key === 'ArrowUp') switchCategory(catRef.current - 1, -1)
        }}
        className="pointer-events-none absolute inset-x-0 outline-none"
        style={{ top: stageTop, height: stageH }}
      />

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
        <p className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-[12px] font-bold text-espresso ring-1 ring-white/80">
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
            const isActive = i === catIndex
            return (
              <button
                key={c.id}
                ref={(el) => {
                  chipRefs.current[i] = el
                }}
                type="button"
                aria-current={isActive}
                onClick={() => i !== catIndex && switchCategory(i, i > catIndex ? 1 : -1)}
                className={`relative min-h-10 shrink-0 rounded-full px-3 text-[13px] font-bold transition-colors duration-300 ${
                  isActive ? '' : 'text-cocoa'
                }`}
                style={isActive ? { color: c.ink } : undefined}
              >
                {isActive && (
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
        style={{ y: sheetY, height: sheetH, color: category.ink, transition: 'color .4s' }}
        className="absolute inset-x-0 bottom-0 z-20 rounded-t-[36px] shadow-[0_-10px_28px_-6px_rgba(42,26,18,.32),0_-2px_6px_rgba(42,26,18,.12)]"
      >
        {/* colour layers cross-fade (opacity only) instead of repainting the sheet */}
        {CATEGORIES.map((c) => (
          <div
            key={c.id}
            aria-hidden
            className="absolute inset-0 rounded-t-[36px] shadow-[inset_0_1px_0_rgba(255,255,255,.22)] transition-opacity duration-500"
            style={{ backgroundColor: c.sheet, opacity: c.id === category.id ? 1 : 0, willChange: 'opacity' }}
          />
        ))}
        <div className="relative h-full">
          <DishSheet
            item={item}
            category={category}
            direction={nav.direction}
            axis={nav.axis}
            expanded={isOpen}
            open={open}
            dragControls={dragControls}
            onToggle={() => snap(!openRef.current)}
            onPeekHeight={setPeek}
          />
        </div>
      </motion.section>
    </div>
  )
}
