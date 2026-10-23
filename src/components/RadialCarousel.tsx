import { animate, motion, useMotionValue, useMotionValueEvent, usePresence, useTransform, type MotionValue } from 'motion/react'
import { memo, useEffect, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { clamp } from '../lib/format'
import type { MenuItem } from '../types'

/** Angle (radians) between neighbouring plates on the orbit. */
const ANGLE = 0.58
/** How far off-centre (in items) a category starts before rolling in, and ends when rolling out. */
const OFFSTAGE = 1.7
const SPRING = { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 } as const

export type CarouselApi = { step: (dir: 1 | -1) => void }

type Props = {
  items: MenuItem[]
  size: number
  radius: number
  width: number
  /** Where the full-bleed blurred photos are drawn (behind header and chips, outside the stage transform). */
  backdropEl: HTMLElement | null
  /** Finger travel (px) that moves the wheel by one plate. */
  stepPx: number
  open: MotionValue<number>
  lockedRef: RefObject<boolean>
  startAt: number
  enterFrom: 1 | -1
  exitDirRef: RefObject<1 | -1>
  apiRef: RefObject<CarouselApi | null>
  onIndex: (index: number, dir: 1 | -1) => void
  onOverflow: (dir: 1 | -1) => boolean
  onTapLocked: () => void
}

/**
 * Plates ride an invisible wheel whose centre sits below the stage:
 * the focused plate is at the top of the wheel, neighbours roll down the sides,
 * shrinking, spinning and losing focus the further they are from the top.
 * Each category gets its own wheel; switching rolls the old one out while the new one rolls in.
 */
export const CategoryCarousel = memo(function CategoryCarousel({
  items,
  size,
  radius,
  width,
  backdropEl,
  stepPx,
  open,
  lockedRef,
  startAt,
  enterFrom,
  exitDirRef,
  apiRef,
  onIndex,
  onOverflow,
  onTapLocked,
}: Props) {
  const n = items.length
  const progress = useMotionValue(startAt - enterFrom * OFFSTAGE)
  const [isPresent, safeToRemove] = usePresence()
  const silent = useRef(true)
  const indexRef = useRef(startAt)
  const targetRef = useRef(startAt)
  const panStart = useRef(0)
  const raw = useRef(0)
  const dragged = useRef(false)

  const goTo = (i: number) => {
    silent.current = false
    targetRef.current = clamp(i, 0, n - 1)
    animate(progress, targetRef.current, SPRING)
  }

  // roll in
  useEffect(() => {
    const c = animate(progress, startAt, {
      ...SPRING,
      onComplete: () => {
        silent.current = false
      },
    })
    return () => c.stop()
  }, [progress, startAt])

  // roll out, in the direction of travel
  useEffect(() => {
    if (isPresent) return
    silent.current = true
    const out = exitDirRef.current > 0 ? n - 1 + OFFSTAGE + 0.3 : -OFFSTAGE - 0.3
    const c = animate(progress, out, { duration: 0.5, ease: [0.4, 0, 0.7, 0.6] })
    c.then(safeToRemove)
    return () => c.stop()
  }, [isPresent, exitDirRef, n, progress, safeToRemove])

  useEffect(() => {
    if (!isPresent) return
    apiRef.current = {
      step: (dir) => {
        const t = targetRef.current + dir
        if (t < 0 || t > n - 1) {
          if (!onOverflow(dir)) goTo(targetRef.current)
        } else goTo(t)
      },
    }
  })

  useMotionValueEvent(progress, 'change', (v) => {
    if (silent.current) return
    const r = clamp(Math.round(v), 0, n - 1)
    if (r !== indexRef.current) {
      const dir = r > indexRef.current ? 1 : -1
      indexRef.current = r
      onIndex(r, dir)
    }
  })

  const rubber = (v: number) => (v < 0 ? v * 0.3 : v > n - 1 ? n - 1 + (v - n + 1) * 0.3 : v)

  return (
    <motion.div
      className="absolute inset-0"
      style={{ touchAction: 'none', pointerEvents: isPresent ? 'auto' : 'none' }}
      onPointerDown={() => {
        dragged.current = false
      }}
      onPanStart={() => {
        if (lockedRef.current) return
        dragged.current = true
        silent.current = false
        progress.stop()
        panStart.current = progress.get()
      }}
      onPan={(_, info) => {
        if (lockedRef.current) return
        raw.current = panStart.current - info.offset.x / stepPx
        progress.set(rubber(raw.current))
      }}
      onPanEnd={(_, info) => {
        if (lockedRef.current) return
        const from = Math.round(panStart.current)
        if (raw.current < -0.45 && onOverflow(-1)) return
        if (raw.current > n - 1 + 0.45 && onOverflow(1)) return
        // a flick advances one dish at most; a slow drag needs to pass the halfway point
        const projected = progress.get() - (info.velocity.x / stepPx) * 0.12
        goTo(clamp(Math.round(projected), from - 1, from + 1))
      }}
      onClick={() => {
        if (lockedRef.current) onTapLocked()
      }}
    >
      {backdropEl &&
        createPortal(
          items.map((item, i) => <Backdrop key={item.id} item={item} index={i} progress={progress} width={width} />),
          backdropEl,
        )}
      {items.map((item, i) => (
        <Plate
          key={item.id}
          item={item}
          index={i}
          progress={progress}
          open={open}
          size={size}
          radius={radius}
          onSelect={() => {
            if (!dragged.current && !lockedRef.current) goTo(i)
          }}
        />
      ))}
    </motion.div>
  )
})

/** The same dish, big and out of focus, sliding sideways and turning a little while its plate rolls along the wheel. */
function Backdrop({ item, index, progress, width }: { item: MenuItem; index: number; progress: MotionValue<number>; width: number }) {
  const d = useTransform(progress, (p) => index - p)
  const x = useTransform(d, (v) => v * width * 0.6)
  const rotate = useTransform(d, (v) => v * 14)
  const opacity = useTransform(d, (v) => 1 - clamp(Math.abs(v), 0, 1))
  return (
    <motion.img
      src={item.imgBack}
      alt=""
      aria-hidden
      draggable={false}
      className="absolute left-1/2 top-1/2 aspect-square max-w-none object-cover"
      style={{
        width: width * 1.35,
        marginLeft: -width * 0.675,
        marginTop: -width * 0.675,
        x,
        rotate,
        opacity,
        willChange: 'transform, opacity',
      }}
    />
  )
}

type PlateProps = {
  item: MenuItem
  index: number
  progress: MotionValue<number>
  open: MotionValue<number>
  size: number
  radius: number
  onSelect: () => void
}

function Plate({ item, index, progress, open, size, radius, onSelect }: PlateProps) {
  const d = useTransform(progress, (p) => index - p)
  const x = useTransform(d, (v) => Math.sin(v * ANGLE) * radius)
  const y = useTransform(d, (v) => radius * (1 - Math.cos(v * ANGLE)))
  const scale = useTransform(d, (v) => 1 - Math.min(Math.abs(v), 2.5) * 0.32)
  const rotate = useTransform(d, (v) => v * 50)
  const sharp = useTransform(d, (v) => 1 - clamp(Math.abs(v) * 1.15, 0, 1))
  // only the focused dish is on stage at rest; neighbours exist only while rolling in or out
  const opacity = useTransform([d, open], ([v, o]: number[]) => {
    const a = Math.abs(v)
    const t = clamp((a - 0.45) / 0.5, 0, 1)
    return (1 - t * t * (3 - 2 * t)) * (1 - o * Math.min(a, 1))
  })
  const zIndex = useTransform(d, (v) => 50 - Math.round(Math.abs(v) * 10))

  return (
    <motion.button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onSelect}
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{
        x,
        y,
        scale,
        opacity,
        zIndex,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        willChange: 'transform, opacity',
        boxShadow: '0 34px 40px -20px rgba(74,36,16,.5), 0 10px 18px -8px rgba(74,36,16,.3)',
      }}
    >
      <motion.div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" style={{ rotate }}>
        <img src={item.imgBlur} alt="" draggable={false} className="absolute inset-0 h-full w-full scale-110 object-cover" />
        <motion.img
          src={item.img}
          alt=""
          draggable={false}
          decoding="async"
          style={{ opacity: sharp }}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
      </motion.div>
    </motion.button>
  )
}
