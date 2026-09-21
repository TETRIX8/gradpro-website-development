'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile, useReducedMotion, useWebGL } from '@/hooks/use-motion-prefs'
import type { ShapeVariant } from './scene-core'

const SceneCore = dynamic(() => import('./scene-core').then((m) => m.SceneCore), {
  ssr: false,
})

type SceneProps = {
  variant?: ShapeVariant
  className?: string
  parallax?: number
  interactive?: boolean
  /** Delay mount until the browser is idle (hero) */
  deferMs?: number
  /** Mount only once scrolled near the viewport (below-the-fold scenes) */
  lazy?: boolean
}

/** Pure-CSS fallback when WebGL is unavailable or while the scene loads. */
export function SceneFallback({ className, variant = 'blob' }: { className?: string; variant?: ShapeVariant }) {
  const tone =
    variant === 'sphere' || variant === 'portal'
      ? 'from-[#a78bfa]/60 via-[#4f7cff]/30 to-transparent'
      : 'from-[#c8ff1f]/50 via-[#a78bfa]/30 to-transparent'
  return (
    <div className={cn('relative', className)} aria-hidden>
      <div
        className={cn(
          'absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.7),rgba(216,218,227,0.25)_25%,rgba(20,22,29,0.9)_60%)] shadow-[inset_-30px_-30px_80px_rgba(167,139,250,0.35),inset_30px_30px_80px_rgba(200,255,31,0.25),0_40px_120px_rgba(0,0,0,0.6)]',
          'animate-float-y',
        )}
      />
      <div
        className={cn(
          'absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial blur-3xl opacity-70',
          tone,
        )}
      />
    </div>
  )
}

export function Scene({
  variant = 'blob',
  className,
  parallax,
  interactive = true,
  deferMs = 150,
  lazy = false,
}: SceneProps) {
  const webgl = useWebGL()
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [inView, setInView] = useState(!lazy)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), deferMs)
    return () => window.clearTimeout(t)
  }, [deferMs])

  useEffect(() => {
    if (!ref.current) return
    const mount = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          mount.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    const pause = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin: '80px 0px' },
    )
    if (lazy) mount.observe(ref.current)
    pause.observe(ref.current)
    return () => {
      mount.disconnect()
      pause.disconnect()
    }
  }, [lazy])

  const showScene = webgl === true && ready && inView

  return (
    <div ref={ref} className={cn('relative', className)}>
      {!showScene && <SceneFallback className="absolute inset-0" variant={variant} />}
      {showScene && (
        <div className="absolute inset-0 animate-in fade-in duration-1000">
          <SceneCore
            variant={variant}
            quality={mobile ? 'low' : 'high'}
            reduced={reduced}
            parallax={parallax ?? (mobile ? 0.3 : 0.8)}
            interactive={interactive && !mobile}
            paused={!visible}
          />
        </div>
      )}
    </div>
  )
}
