'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

type Ctx = {
  navigate: (href: string, origin?: DOMRect | null) => void
  transitioning: boolean
}

const TransitionContext = createContext<Ctx>({
  navigate: () => {},
  transitioning: false,
})

export const usePageTransition = () => useContext(TransitionContext)

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Orchestrates page transitions:
 * 1) current page dims  2) gradient veil slides in with the logo fixed
 * 3) route changes  4) veil lifts and new content is revealed via clip-path.
 */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<'idle' | 'cover' | 'reveal'>('idle')
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)
  const pendingHref = useRef<string | null>(null)
  const lastPath = useRef(pathname)

  const navigate = useCallback(
    (href: string, origin?: DOMRect | null) => {
      if (href === pathname) return
      if (reduced) {
        router.push(href)
        return
      }
      pendingHref.current = href
      setOriginRect(origin ?? null)
      setPhase('cover')
      window.setTimeout(() => router.push(href), 420)
    },
    [pathname, reduced, router],
  )

  useEffect(() => {
    if (pathname !== lastPath.current) {
      lastPath.current = pathname
      if (phase === 'cover') {
        window.scrollTo({ top: 0, behavior: 'auto' })
        const t = window.setTimeout(() => setPhase('reveal'), 80)
        return () => window.clearTimeout(t)
      }
    }
  }, [pathname, phase])

  useEffect(() => {
    if (phase === 'reveal') {
      const t = window.setTimeout(() => {
        setPhase('idle')
        setOriginRect(null)
      }, 720)
      return () => window.clearTimeout(t)
    }
  }, [phase])

  const covering = phase === 'cover'

  return (
    <TransitionContext.Provider value={{ navigate, transitioning: phase !== 'idle' }}>
      <motion.div
        animate={{
          opacity: covering ? 0.4 : 1,
          scale: covering ? 0.985 : 1,
          filter: covering ? 'blur(6px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ transformOrigin: 'center top' }}
      >
        <motion.div
          key={pathname}
          initial={reduced ? false : { clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
        >
          {children}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            key="veil"
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[9000] flex items-center justify-center"
            initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
            animate={{
              clipPath: phase === 'cover' ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="absolute inset-0 bg-graphite" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(124,92,245,0.45),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(163,217,0,0.2),transparent_70%)]" />
            <motion.span
              className="relative font-display text-2xl font-bold tracking-[0.2em] text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
            >
              GRAD<span className="text-primary">PRO</span>
            </motion.span>
            {originRect && (
              <motion.div
                className="absolute rounded-3xl border border-primary/40 bg-primary/10"
                initial={{
                  left: originRect.left,
                  top: originRect.top,
                  width: originRect.width,
                  height: originRect.height,
                  opacity: 1,
                }}
                animate={{
                  left: 0,
                  top: 0,
                  width: '100vw',
                  height: '100vh',
                  opacity: 0.35,
                  borderRadius: 0,
                }}
                transition={{ duration: 0.7, ease: EASE }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  )
}

type TransitionLinkProps = {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
  /** Pass the card element so the veil can scale from it (project cards). */
  originRef?: React.RefObject<HTMLElement | null>
  'data-cursor'?: string
  'aria-label'?: string
}

export function TransitionLink({
  href,
  children,
  className,
  onClick,
  originRef,
  ...rest
}: TransitionLinkProps) {
  const { navigate } = usePageTransition()
  const isHash = href.startsWith('#')
  const isExternal = /^https?:\/\//.test(href)

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.()
    if (isHash || isExternal || e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigate(href, originRef?.current?.getBoundingClientRect() ?? null)
  }

  return (
    <Link href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
