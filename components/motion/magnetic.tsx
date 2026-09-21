'use client'

import { useRef, type ReactNode, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useIsTouch, useReducedMotion } from '@/hooks/use-motion-prefs'

type MagneticProps = {
  children: ReactNode
  strength?: number
  className?: string
}

/** Wraps an element and pulls it gently toward the cursor while hovered. */
export function Magnetic({ children, strength = 0.35, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isTouch = useIsTouch()
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 })

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isTouch || reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    x.set(dx * strength)
    y.set(dy * strength)
  }
  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
