import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MenuScreen } from './components/MenuScreen'
import { toMenu } from './data/adapter'
import { fetchMenu } from './data/repository'
import type { Menu } from './types'

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 390, height: 844 })
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

type Load = { status: 'loading' } | { status: 'ready'; menu: Menu } | { status: 'error'; message: string }

/** Loads the menu from the data layer (a JSON "database" for now). */
function useMenu() {
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const ctrl = new AbortController()
    fetchMenu('la-sablee', ctrl.signal)
      .then((db) => setLoad({ status: 'ready', menu: toMenu(db) }))
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setLoad({ status: 'error', message: e instanceof Error ? e.message : String(e) })
      })
    return () => ctrl.abort()
  }, [attempt])
  const retry = () => {
    setLoad({ status: 'loading' })
    setAttempt((a) => a + 1)
  }
  return [load, retry] as const
}

export default function App() {
  const [frameRef, { width, height }] = useSize<HTMLDivElement>()
  const [load, retry] = useMenu()

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh w-full items-center justify-center md:p-6">
        <div
          ref={frameRef}
          className="relative h-dvh w-full max-w-[430px] overflow-hidden bg-cream md:h-[880px] md:max-h-[calc(100dvh-48px)] md:rounded-[44px] md:shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]"
        >
          {load.status === 'ready' && <MenuScreen width={width} height={height} menu={load.menu} />}
          <AnimatePresence>
            {load.status !== 'ready' && (
              <motion.div
                key="splash"
                exit={{ opacity: 0, transition: { duration: 0.35 } }}
                className="absolute inset-0 z-50 grid place-items-center bg-cream px-8 text-center"
              >
                {load.status === 'loading' ? (
                  <motion.span
                    role="status"
                    aria-label="Cargando la carta"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="grid size-14 place-items-center rounded-full bg-espresso font-display text-2xl font-semibold italic text-cream"
                  >
                    S
                  </motion.span>
                ) : (
                  <div role="alert">
                    <p className="font-display text-xl font-semibold">No pudimos cargar la carta</p>
                    <p className="mt-1 text-sm text-cocoa">{load.message}</p>
                    <button type="button" onClick={retry} className="mt-5 min-h-11 rounded-full bg-espresso px-6 text-sm font-bold text-cream">
                      Reintentar
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  )
}
