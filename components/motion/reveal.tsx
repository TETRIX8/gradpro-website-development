'use client'

import { type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

export const EASE_OUT = [0.16, 1, 0.3, 1] as const

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
  amount?: number
  as?: 'div' | 'section' | 'span' | 'p' | 'li'
}

/** Fade + rise on scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 32,
  once = true,
  amount = 0.3,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion()
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={reduced ? false : { opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
    >
      {children}
    </Comp>
  )
}

/** Clip-path wipe reveal — for headings. */
export function ClipReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left'
}) {
  const reduced = useReducedMotion()
  const hidden =
    direction === 'up' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)'
  // The observer sits on an unclipped wrapper: a fully clipped element never intersects.
  return (
    <motion.div
      className={className}
      initial={reduced ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.div
        variants={{
          hidden: { clipPath: hidden, y: direction === 'up' ? 24 : 0 },
          show: { clipPath: 'inset(0% 0% 0% 0%)', y: 0 },
        }}
        transition={{ duration: 1, ease: EASE_OUT, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

const wordContainer: Variants = {
  hidden: {},
  show: (stagger: number = 0.06) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.1 },
  }),
}

const wordItem: Variants = {
  hidden: { y: '110%', opacity: 0, rotateX: -20 },
  show: {
    y: '0%',
    opacity: 1,
    rotateX: 0,
    transition: { duration: 0.9, ease: EASE_OUT },
  },
}

type SplitWordsProps = {
  text: string
  className?: string
  wordClassName?: string
  /** Words to highlight with a gradient (case-insensitive, without punctuation). */
  highlight?: string[]
  highlightClassName?: string
  stagger?: number
  animateOnMount?: boolean
}

/** Splits text into words and animates each up from its own overflow mask. */
export function SplitWords({
  text,
  className,
  wordClassName,
  highlight = [],
  highlightClassName = 'text-gradient-lime animate-gradient-shift',
  stagger = 0.06,
  animateOnMount = false,
}: SplitWordsProps) {
  const reduced = useReducedMotion()
  const lines = text.split('\n')
  const normalize = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  const hl = highlight.map(normalize)

  return (
    <motion.span
      className={cn('inline-block', className)}
      variants={wordContainer}
      custom={stagger}
      initial={reduced ? 'show' : 'hidden'}
      {...(animateOnMount
        ? { animate: 'show' }
        : { whileInView: 'show', viewport: { once: true, amount: 0.5 } })}
    >
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((word, wi) => (
            <span
              key={`${li}-${wi}`}
              className="inline-block overflow-hidden pb-[0.12em] align-bottom"
            >
              <motion.span
                variants={wordItem}
                className={cn(
                  'inline-block will-change-transform',
                  wordClassName,
                  hl.includes(normalize(word)) && highlightClassName,
                )}
                style={{ transformOrigin: 'bottom' }}
              >
                {word}
                {wi < line.split(' ').length - 1 ? '\u00A0' : ''}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </motion.span>
  )
}

/** Staggers direct children in on view. */
export function Stagger({
  children,
  className,
  stagger = 0.1,
  amount = 0.2,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  amount?: number
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE_OUT },
  },
}
