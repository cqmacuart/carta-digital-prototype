import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react'
import { memo, useEffect, useRef, useState, type RefObject } from 'react'
import { clamp } from '../lib/format'
import type { MenuItem } from '../types'

/** Angle (radians) between neighbouring plates on the orbit. */
const ANGLE = 0.58
const SPRING = { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 } as const

/** Imperative handle; gestures are recognised by the parent, which owns the axis lock. */
export type CarouselApi = {
  step: (dir: 1 | -1) => void
  jump: (index: number) => void
  panStart: () => void
  pan: (dx: number) => void
  panEnd: (vx: number) => void
  isDragging: () => boolean
}

type Props = {
  catIndex: number
  items: MenuItem[]
  width: number
  /** Scene geometry */
  stageTop: number
  stageH: number
  backdropH: number
  size: number
  radius: number
  /** Finger travel (px) that moves the wheel by one plate. */
  stepPx: number
  /** Sheet openness (0–1) and the stage transform it drives. */
  open: MotionValue<number>
  stageY: MotionValue<number>
  stageScale: MotionValue<number>
  lockedRef: RefObject<boolean>
  register: (catIndex: number, api: CarouselApi) => void
  onIndex: (catIndex: number, index: number, dir: 1 | -1) => void
  onOverflow: (dir: 1 | -1) => boolean
}

/**
 * One category = one scene: the dish's blurred photo as the surface of the top third, and a wheel
 * of plates whose centre sits below the stage. The focused plate sits at the top of the wheel;
 * neighbours roll down the sides, shrinking, spinning and losing focus.
 * Only the focused plate and its two neighbours are mounted.
 */
export const CategoryScene = memo(function CategoryScene({
  catIndex,
  items,
  width,
  stageTop,
  stageH,
  backdropH,
  size,
  radius,
  stepPx,
  open,
  stageY,
  stageScale,
  lockedRef,
  register,
  onIndex,
  onOverflow,
}: Props) {
  const n = items.length
  const progress = useMotionValue(0)
  const [near, setNear] = useState(0)
  const indexRef = useRef(0)
  const targetRef = useRef(0)
  const panStart = useRef(0)
  const raw = useRef(0)
  const dragging = useRef(false)

  const goTo = (i: number) => {
    targetRef.current = clamp(i, 0, n - 1)
    animate(progress, targetRef.current, SPRING)
  }

  useMotionValueEvent(progress, 'change', (v) => {
    const r = clamp(Math.round(v), 0, n - 1)
    if (r !== indexRef.current) {
      const dir = r > indexRef.current ? 1 : -1
      indexRef.current = r
      setNear(r)
      onIndex(catIndex, r, dir)
    }
  })

  const rubber = (v: number) => (v < 0 ? v * 0.3 : v > n - 1 ? n - 1 + (v - n + 1) * 0.3 : v)

  useEffect(() => {
    register(catIndex, {
      step: (dir) => {
        const t = targetRef.current + dir
        if (t < 0 || t > n - 1) onOverflow(dir)
        else goTo(t)
      },
      jump: (i) => {
        progress.stop()
        targetRef.current = clamp(i, 0, n - 1)
        progress.set(targetRef.current)
      },
      panStart: () => {
        dragging.current = true
        progress.stop()
        panStart.current = progress.get()
      },
      pan: (dx) => {
        raw.current = panStart.current - dx / stepPx
        progress.set(rubber(raw.current))
      },
      panEnd: (vx) => {
        const from = Math.round(panStart.current)
        // let the tap that ends this gesture be ignored by the plates
        setTimeout(() => (dragging.current = false), 0)
        if (raw.current < -0.45 && onOverflow(-1)) return goTo(0)
        if (raw.current > n - 1 + 0.45 && onOverflow(1)) return goTo(n - 1)
        // a flick advances one dish at most; a slow drag needs to pass the halfway point
        const projected = progress.get() - (vx / stepPx) * 0.12
        goTo(clamp(Math.round(projected), from - 1, from + 1))
      },
      isDragging: () => dragging.current,
    })
  })

  const visible = items.map((item, i) => ({ item, i })).filter(({ i }) => Math.abs(i - near) <= 1)

  return (
    <>
      {/* the dish itself, big and out of focus; ends exactly at the plate's equator */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
        style={{
          height: backdropH,
          maskImage: 'linear-gradient(to bottom, #000 calc(100% - 18px), transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 calc(100% - 18px), transparent)',
        }}
      >
        {visible.map(({ item, i }) => (
          <Backdrop key={item.id} item={item} index={i} progress={progress} width={width} />
        ))}
      </div>

      <motion.div
        className="absolute inset-x-0"
        style={{ top: stageTop, height: stageH, y: stageY, scale: stageScale, willChange: 'transform' }}
      >
        {visible.map(({ item, i }) => (
          <Plate
            key={item.id}
            item={item}
            index={i}
            progress={progress}
            open={open}
            size={size}
            radius={radius}
            onSelect={() => {
              if (!dragging.current && !lockedRef.current) goTo(i)
            }}
          />
        ))}
      </motion.div>
    </>
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
