import { AnimatePresence, motion, useAnimationControls, useTransform, type MotionValue } from 'motion/react'
import { ShoppingBag } from 'lucide-react'
import { useEffect } from 'react'
import { CUTOUT, photoClass, thumbShadow } from '../lib/shape'
import type { Menu } from '../types'
import { land, loadCart, setCartOpen, setFlightSpace, useCart, type Flight } from './cart'

const TAP = { type: 'spring', stiffness: 520, damping: 15 } as const
/** the photo that flies to the bag, and how long the trip takes */
const FLYER = 44
const TRIP = 0.7

type Props = {
  menu: Menu
  /** sheet openness, 0 (collapsed) to 1 (open) */
  open: MotionValue<number>
  /** where the bag floats with the sheet collapsed, and with it open (px from the top) */
  top: number
  openTop: number
}

/**
 * The bag, floating on the right level with the category rail, with how many things are in it. With the sheet open
 * it shrinks and rises so it never sits on the sheet; it hops whenever a dish lands in it.
 */
export function CartButton({ menu, open, top, openTop }: Props) {
  loadCart(menu)
  const { lines, added, flights } = useCart()
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const y = useTransform(open, [0, 1], [0, openTop - top])
  const scale = useTransform(open, [0, 1], [1, 0.8])
  const hop = useAnimationControls()
  useEffect(() => {
    if (added) hop.start({ scale: [1, 1.3, 0.92, 1], rotate: [0, -12, 8, 0], transition: { duration: 0.5 } })
  }, [added, hop])

  return (
    <>
      <motion.div className="absolute right-[10px] z-30" style={{ top, y, scale, originX: 1 }}>
        <motion.button
          ref={(el) => setFlightSpace(el)}
          type="button"
          aria-label={count ? `Tu pedido: ${count} ${count === 1 ? 'producto' : 'productos'}` : 'Tu pedido (vacío)'}
          aria-haspopup="dialog"
          animate={hop}
          whileTap={{ scale: 0.88 }}
          transition={TAP}
          onClick={() => setCartOpen(true)}
          className="relative grid size-[52px] place-items-center rounded-full bg-white/80 text-espresso ring-1 ring-white shadow-[0_8px_18px_-8px_rgba(42,26,18,.55)]"
        >
          <ShoppingBag size={21} strokeWidth={2.3} aria-hidden />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key="n"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={TAP}
                className="absolute -right-1 -top-1 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-terra px-1 text-[11px] font-bold tabular-nums text-white ring-2 ring-cream"
                aria-hidden
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* photos on their way to the bag, above the sheet */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-clip">
        {flights.map((f) => (
          <Flyer key={f.id} flight={f} />
        ))}
      </div>
    </>
  )
}

/** x eases in and y eases out, so the photo arcs up toward the bag instead of sliding along a straight line. */
function Flyer({ flight: { id, from, to, img } }: { flight: Flight }) {
  return (
    <motion.img
      src={img}
      alt=""
      className={`absolute ${photoClass} ${CUTOUT ? thumbShadow : 'shadow-[0_8px_18px_-6px_rgba(42,26,18,.6)] ring-2 ring-white'}`}
      style={{ left: from.x - FLYER / 2, top: from.y - FLYER / 2, width: FLYER, height: FLYER }}
      initial={{ x: 0, y: 0, scale: 0.6, opacity: 0 }}
      animate={{ x: to.x - from.x, y: to.y - from.y, scale: [0.6, 1.15, 0.45], opacity: [0, 1, 1, 0.9] }}
      transition={{
        x: { duration: TRIP, ease: [0.55, 0, 0.85, 0.6] },
        y: { duration: TRIP, ease: [0.15, 0.6, 0.4, 1] },
        scale: { duration: TRIP, times: [0, 0.3, 1] },
        opacity: { duration: TRIP, times: [0, 0.12, 0.85, 1] },
      }}
      onAnimationComplete={() => land(id)}
    />
  )
}
