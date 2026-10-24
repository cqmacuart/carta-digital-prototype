import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useTransform } from 'motion/react'
import { ChevronRight, MapPin } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CATEGORIES, MENU, itemsOf } from '../data/menu'
import { clamp } from '../lib/format'
import { CategoryScene, type CarouselApi } from './RadialCarousel'
import { DishSheet } from './DishSheet'
import { ScrollCaret } from './ScrollCaret'
import { useScrollEdges } from '../lib/useScrollEdges'

const HEADER = 64
/** Category name + subcategory chips */
const NAV = 76
/** Category rail on the left; the plate sits to its right */
const RAIL_X = 10
const RAIL_W = 52
/** Widest the subcategory panel gets; beyond it the chips scroll behind pulsing carets. */
const PANEL_MAX = 340
/** Typical collapsed-sheet height, used to lay out the stage so the plate never jumps between dishes. */
const PEEK = 190
/** Breathing room under the collapsed sheet's content. */
const PEEK_PAD = 6
/** Tallest a collapsed sheet can get; the stage only reacts once the sheet rises above this, so it never moves between dishes. */
const MAX_PEEK = 290
/** Finger travel before a gesture commits to dishes (←→) or categories (↑↓). */
const AXIS_LOCK_PX = 10
const PAGE_SPRING ={ type: 'spring', stiffness: 230, damping: 30, mass: 0.9 } as const

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
  const stageTop = HEADER + NAV
  const stageLeft = RAIL_X + RAIL_W
  // the stage ends well above the sheet, so the plate keeps breathing room on short phones too
  const stageH = Math.max(220, height - stageTop - PEEK + 10)
  const size = Math.min(stageH * 0.62, (width - stageLeft) * 0.86, 300)
  const railButton = height < 720 ? 38 : 44
  // the rail stops above the sheet; any categories beyond scroll behind carets
  const railMax = Math.max(railButton * 3 + 16, height - PEEK - (stageTop + 6) - 24)
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

  // swipe hint: shown on every visit on the very first dish, gone after that visit's first move
  const [hintSeen, setHintSeen] = useState(false)
  const hintDone = useRef(false)
  const markHintSeen = () => {
    if (hintDone.current) return
    hintDone.current = true
    setHintSeen(true)
  }

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
    markHintSeen()
    setCatIndex(next)
    setNav({ index: dishOf.current[next], direction: dir, axis: 'y' })
    animate(trackY, -next * pitch, PAGE_SPRING)
    return true
  }
  useEffect(() => {
    trackY.set(-catRef.current * pitch)
  }, [pitch, trackY])

  // decode photos ahead of time, a few per idle slot (menu order = nearest first), so it never competes with a swipe
  useEffect(() => {
    const queue = MENU.flatMap((m) => [m.imgBlur, m.imgBack, m.img])
    const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 8 }), 50))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    let handle = 0
    const pump = (deadline: IdleDeadline) => {
      while (queue.length && deadline.timeRemaining() > 4) {
        const im = new Image()
        im.src = queue.shift()!
        im.decode().catch(() => {})
      }
      if (queue.length) handle = idle(pump)
    }
    handle = idle(pump)
    return () => cancel(handle)
  }, [])

  // subcategory chips follow the dish on stage; tapping one rolls the wheel there
  const subIndex = Math.max(0, category.subcategories.findIndex((s) => s.id === item.sub))
  const goToSub = (subId: string) => {
    markHintSeen()
    apis.current[catIndex]?.roll(ITEMS[catIndex].findIndex((m) => m.sub === subId))
  }

  // keep the active chip / rail icon in view (scroll only their own containers, never the page)
  const hasChips = category.subcategories.length > 1
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const railRef = useRef<HTMLDivElement>(null)
  const catRailRef = useRef<HTMLDivElement>(null)
  const chipEdges = useScrollEdges(railRef, 'x', category.id)
  const railEdges = useScrollEdges(catRailRef, 'y', railMax)
  const chipFade = `linear-gradient(to right, ${chipEdges.start ? 'transparent, #000 14%' : '#000'}, ${chipEdges.end ? '#000 86%, transparent' : '#000'})`
  useEffect(() => {
    const chip = chipRefs.current[subIndex]
    const rail = railRef.current
    if (!chip || !rail) return
    rail.scrollTo({ left: chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [subIndex, catIndex])
  useEffect(() => {
    const rail = catRailRef.current
    const btn = rail?.children[catIndex] as HTMLElement | undefined
    if (!rail || !btn) return
    rail.scrollTo({ top: btn.offsetTop - (rail.clientHeight - btn.offsetHeight) / 2, behavior: 'smooth' })
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
  // with the sheet open the rail hides, so the plate drifts back to the centre
  const stageX = useTransform(open, (o) => (-o * stageLeft) / 2)
  const stageScale = useTransform(open, [0, 1], [1, 0.6])
  const chipsOpacity = useTransform(open, [0, 0.4], [1, 0])

  // stable callbacks keep the memoised scenes from re-rendering on every dish change
  const latest = useRef({ switchCategory })
  useEffect(() => {
    latest.current = { switchCategory }
  })
  const onIndex = useCallback((cat: number, index: number, direction: 1 | -1) => {
    dishOf.current[cat] = index
    if (cat !== catRef.current) return
    setNav({ index, direction, axis: 'x' })
    if (index !== 0) markHintSeen()
  }, [])

  const showHint = !hintSeen && catIndex === 0 && nav.index === 0 && !isOpen
  useEffect(() => {
    if (hintSeen || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => apis.current[0]?.nudge(), 1500)
    return () => clearTimeout(t)
  }, [hintSeen])
  const register = useCallback((cat: number, api: CarouselApi) => {
    apis.current[cat] = api
  }, [])
  const onOverflow = useCallback(
    (dir: 1 | -1) => latest.current.switchCategory(catRef.current + dir, dir, dir > 0 ? 'start' : 'end'),
    [],
  )

  // ---- gestures: horizontal = dishes, vertical = categories -----------------
  const axis = useRef<'x' | 'y' | null>(null)
  const lockAt = useRef({ x: 0, y: 0 })
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
        onPanStart={() => {
          axis.current = null
        }}
        onPan={(_, info) => {
          if (openRef.current) return
          const { x: dx, y: dy } = info.offset
          if (!axis.current) {
            // lock the axis only once the finger has clearly picked a direction; dishes win ties
            if (Math.hypot(dx, dy) < AXIS_LOCK_PX) return
            axis.current = Math.abs(dy) > Math.abs(dx) * 1.4 ? 'y' : 'x'
            lockAt.current = { x: dx, y: dy }
            if (axis.current === 'x') active()?.panStart()
            else trackY.stop()
          }
          if (axis.current === 'x') active()?.pan(dx - lockAt.current.x)
          else trackY.set(-catRef.current * pitch + pageRubber(dy - lockAt.current.y))
        }}
        onPanEnd={(_, info) => {
          if (openRef.current || !axis.current) return
          if (axis.current === 'x') active()?.panEnd(info.velocity.x)
          else {
            const y = info.offset.y - lockAt.current.y
            const { x: vx, y: vy } = info.velocity
            const flick = Math.abs(vy) > 650 && Math.abs(vy) > Math.abs(vx) * 1.4
            const dir = y < -110 || (flick && vy < 0) ? 1 : y > 110 || (flick && vy > 0) ? -1 : 0
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
              stageLeft={stageLeft}
              stageH={stageH}
              backdropH={plateCenter}
              size={size}
              radius={radius}
              stepPx={width * 0.65}
              open={open}
              stageX={stageX}
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

      {/* swipe hint: three chevrons pulsing in a cascade by the right edge, where the plate's curve leaves room */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            key="hint"
            role="note"
            aria-label="Desliza para ver más"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.8, duration: 0.5 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="pointer-events-none absolute right-3 z-10 flex flex-col items-center gap-0.5 text-espresso"
            style={{ top: plateCenter + size * 0.4 }}
          >
            <span className="flex -space-x-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.15, 0.9, 0.15] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 1 + i * 0.18 }}
                >
                  <ChevronRight size={16} strokeWidth={2.6} />
                </motion.span>
              ))}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-60" aria-hidden>
              desliza
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
          <span className="grid size-9 place-items-center rounded-full bg-espresso font-display text-[17px] font-semibold italic text-cream">
            S
          </span>
          <div className="leading-none">
            <p className="font-display text-[19px] font-semibold tracking-tight">La Sablée</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-cocoa">café · pastelería</p>
          </div>
        </div>
        <p className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[12px] font-bold text-espresso ring-1 ring-white/80">
          <MapPin size={14} strokeWidth={2.4} aria-hidden />
          Calle Real
        </p>
      </header>

      {/* category name over its subcategories: centred, capped width, scrolls with carets when it overflows */}
      <motion.nav
        aria-label={`Subcategorías de ${category.name}`}
        style={{ top: HEADER, height: NAV, opacity: chipsOpacity }}
        className="absolute inset-x-0 z-30 flex items-center justify-center px-3"
      >
        <div
          className="flex min-w-0 flex-col items-center gap-1 rounded-[24px] bg-white/70 p-1 pt-1.5 ring-1 ring-white/80"
          style={{ maxWidth: Math.min(width - 24, PANEL_MAX) }}
        >
          <div className="relative h-5 w-full overflow-hidden px-3">
            <AnimatePresence initial={false} mode="popLayout" custom={nav.direction}>
              <motion.p
                key={category.id}
                custom={nav.direction}
                initial={{ y: nav.direction * 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: nav.direction * -18, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="flex items-baseline justify-center gap-1.5 whitespace-nowrap font-display text-[17px] font-semibold leading-5 text-espresso"
              >
                {category.name}
                <span className="font-sans text-[12px] font-bold text-cocoa">({ITEMS[catIndex].length})</span>
              </motion.p>
            </AnimatePresence>
          </div>
          {hasChips && (
            <div className="relative max-w-full">
              <ScrollCaret target={railRef} axis="x" side="start" show={chipEdges.start} label="Ver subcategorías anteriores" className="left-0.5 top-1" />
              <ScrollCaret target={railRef} axis="x" side="end" show={chipEdges.end} label="Ver más subcategorías" className="right-0.5 top-1" />
              <div
                ref={railRef}
                className="no-scrollbar relative flex max-w-full gap-0.5 overflow-x-auto rounded-full"
                style={{ maskImage: chipFade, WebkitMaskImage: chipFade }}
              >
                {category.subcategories.map((s, i) => {
                  const isActive = i === subIndex
                  return (
                    <button
                      key={`${category.id}-${s.id}`}
                      ref={(el) => {
                        chipRefs.current[i] = el
                      }}
                      type="button"
                      aria-current={isActive}
                      onClick={() => !isActive && goToSub(s.id)}
                      className={`relative min-h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold transition-colors duration-300 ${
                        isActive ? '' : 'text-cocoa'
                      }`}
                      style={isActive ? { color: category.ink } : undefined}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="sub"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-full"
                          style={{ backgroundColor: category.sheet }}
                        />
                      )}
                      <span className="relative">{s.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </motion.nav>

      {/* category rail: one icon per category, vertical like the swipe that changes it; scrolls with carets when taller than its room */}
      <motion.nav
        aria-label="Categorías"
        style={{ top: stageTop + 6, left: RAIL_X, width: RAIL_W, opacity: chipsOpacity }}
        className="absolute z-30 rounded-full bg-white/70 ring-1 ring-white/80"
      >
        <ScrollCaret target={catRailRef} axis="y" side="start" show={railEdges.start} label="Ver categorías anteriores" className="left-1/2 -top-2 -translate-x-1/2" />
        <ScrollCaret target={catRailRef} axis="y" side="end" show={railEdges.end} label="Ver más categorías" className="left-1/2 -bottom-2 -translate-x-1/2" />
        <div
          ref={catRailRef}
          className="no-scrollbar flex flex-col items-center gap-1 overflow-y-auto overscroll-contain rounded-full p-1"
          style={{ maxHeight: railMax }}
        >
          {CATEGORIES.map((c, i) => {
            const isActive = i === catIndex
            const Icon = c.icon
            return (
              <button
                key={c.id}
                type="button"
                aria-label={c.name}
                aria-current={isActive}
                onClick={() => i !== catIndex && switchCategory(i, i > catIndex ? 1 : -1)}
                className={`relative grid shrink-0 place-items-center rounded-full transition-colors duration-300 ${isActive ? '' : 'text-cocoa'}`}
                style={{ width: railButton, height: railButton, color: isActive ? c.ink : undefined }}
              >
                {isActive && (
                  <motion.span
                    layoutId="rail"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full shadow-[0_6px_14px_-6px_rgba(42,26,18,.55)]"
                    style={{ backgroundColor: c.sheet }}
                  />
                )}
                <Icon size={railButton < 44 ? 18 : 20} strokeWidth={2.1} className="relative" aria-hidden />
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
