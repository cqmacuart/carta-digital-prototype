import { MotionConfig } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { MenuScreen } from './components/MenuScreen'

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

export default function App() {
  const [frameRef, { width, height }] = useSize<HTMLDivElement>()

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh w-full items-center justify-center md:p-6">
        <div
          ref={frameRef}
          className="relative h-dvh w-full max-w-[430px] overflow-hidden bg-cream md:h-[880px] md:max-h-[calc(100dvh-48px)] md:rounded-[44px] md:shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]"
        >
          <MenuScreen width={width} height={height} />
        </div>
      </div>
    </MotionConfig>
  )
}
