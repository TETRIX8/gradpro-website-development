'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile, useWebGL } from '@/hooks/use-motion-prefs'
import { SceneFallback } from './scene'

const ServicesSceneCore = dynamic(
  () => import('./services-scene-core').then((m) => m.ServicesSceneCore),
  { ssr: false },
)

export function ServicesScene({ active, className }: { active: number; className?: string }) {
  const webgl = useWebGL()
  const mobile = useIsMobile()
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!ref.current) return
    const mount = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          mount.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    const pause = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin: '80px 0px' },
    )
    mount.observe(ref.current)
    pause.observe(ref.current)
    return () => {
      mount.disconnect()
      pause.disconnect()
    }
  }, [])

  const show = webgl === true && inView

  return (
    <div ref={ref} className={cn('relative', className)}>
      {!show && <SceneFallback className="absolute inset-0" variant={active % 2 ? 'sphere' : 'blob'} />}
      {show && (
        <div className="absolute inset-0 animate-in fade-in duration-1000">
          <ServicesSceneCore active={active} low={mobile} paused={!visible} />
        </div>
      )}
    </div>
  )
}
