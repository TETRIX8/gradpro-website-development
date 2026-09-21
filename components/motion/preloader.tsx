'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

const DURATION_MS = 3000
const EASE = [0.16, 1, 0.3, 1] as const

const PreloaderContext = createContext<{ done: boolean }>({ done: true })
export const usePreloader = () => useContext(PreloaderContext)

/**
 * Full-screen intro shown on the first paint of public pages.
 * Children stay in the DOM (SEO), the overlay simply covers them for 3s.
 */
export function PreloaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const isAdmin = pathname.startsWith('/admin')
  const [done, setDone] = useState(isAdmin)

  useEffect(() => {
    if (isAdmin) {
      setDone(true)
      return
    }
    if (reduced) {
      setDone(true)
      return
    }
    document.documentElement.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      setDone(true)
      document.documentElement.style.overflow = ''
    }, DURATION_MS)
    return () => {
      window.clearTimeout(t)
      document.documentElement.style.overflow = ''
    }
    // Only runs on first mount: client-side navigations must not re-trigger the intro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PreloaderContext.Provider value={{ done }}>
      {children}
      <AnimatePresence>{!done && <PreloaderOverlay />}</AnimatePresence>
    </PreloaderContext.Provider>
  )
}

function PreloaderOverlay() {
  const progress = useMotionValue(0)
  const percent = useTransform(progress, (v) => `${Math.round(v)}`)
  const lineScale = useTransform(progress, [0, 100], [0, 1])

  useEffect(() => {
    const controls = animate(progress, 100, {
      duration: (DURATION_MS - 250) / 1000,
      ease: [0.65, 0, 0.35, 1],
    })
    return () => controls.stop()
  }, [progress])

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Загрузка сайта"
      className="fixed inset-0 z-[9999] flex flex-col justify-between bg-background px-6 py-8 md:px-10 md:py-10"
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
      <div
        className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,255,31,0.12),transparent_65%)] blur-3xl"
        aria-hidden
      />

      <motion.span
        className="relative font-display text-sm font-bold tracking-[0.3em] text-foreground"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      >
        GRAD<span className="text-primary">PRO</span>
      </motion.span>

      <div className="relative flex flex-col gap-6">
        <div className="flex items-end justify-between gap-6">
          <motion.p
            className="max-w-xs text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Создаём сайты, которые невозможно забыть
          </motion.p>
          <motion.p
            className="font-display text-[clamp(4rem,16vw,11rem)] font-bold leading-none tracking-tight text-foreground tabular-nums"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          >
            <motion.span>{percent}</motion.span>
            <span className="text-primary">%</span>
          </motion.p>
        </div>
        <div className="h-px w-full bg-border" aria-hidden>
          <motion.div
            className="h-full w-full origin-left bg-primary shadow-[0_0_18px_rgba(200,255,31,0.8)]"
            style={{ scaleX: lineScale }}
          />
        </div>
      </div>
    </motion.div>
  )
}
