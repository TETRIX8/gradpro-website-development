'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

type Drop = {
  size: number
  x: string
  y: string
  depth: number
  duration: number
  delay: number
  radius: string
}

const DROPS: Drop[] = [
  { size: 260, x: '58%', y: '14%', depth: 1, duration: 11, delay: 0, radius: '58% 42% 55% 45% / 50% 60% 40% 50%' },
  { size: 150, x: '80%', y: '48%', depth: 1.8, duration: 9, delay: 0.6, radius: '45% 55% 50% 50% / 55% 45% 55% 45%' },
  { size: 96, x: '66%', y: '68%', depth: 2.6, duration: 7.5, delay: 1.2, radius: '52% 48% 45% 55% / 48% 55% 45% 52%' },
  { size: 64, x: '90%', y: '20%', depth: 3.2, duration: 6.5, delay: 0.3, radius: '50%' },
]

export function LiquidDrops({ active }: { active: boolean }) {
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 18, mass: 0.8 })
  const sy = useSpring(my, { stiffness: 40, damping: 18, mass: 0.8 })
  const frame = useRef<number>(0)

  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        mx.set((e.clientX / window.innerWidth - 0.5) * 2)
        my.set((e.clientY / window.innerHeight - 0.5) * 2)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame.current)
    }
  }, [mx, my, reduced])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Colour blooms sit behind the glass so the blur/saturation has something to refract */}
      <div className="absolute right-[-10%] top-[8%] h-[52vh] w-[52vh] rounded-full bg-[radial-gradient(circle,rgba(163,217,0,0.55),transparent_62%)] blur-3xl" />
      <div className="absolute right-[18%] top-[42%] h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(124,92,245,0.42),transparent_62%)] blur-3xl" />
      <div className="absolute right-[38%] top-[62%] h-[30vh] w-[30vh] rounded-full bg-[radial-gradient(circle,rgba(59,108,240,0.35),transparent_62%)] blur-3xl" />

      {DROPS.map((drop, i) => (
        <GlassDrop key={i} drop={drop} sx={sx} sy={sy} active={active} reduced={reduced} />
      ))}
    </div>
  )
}

function GlassDrop({
  drop,
  sx,
  sy,
  active,
  reduced,
}: {
  drop: Drop
  sx: MotionValue<number>
  sy: MotionValue<number>
  active: boolean
  reduced: boolean
}) {
  const shift = 14 * drop.depth
  const x = useTransform(sx, (v) => v * shift)
  const y = useTransform(sy, (v) => v * shift)

  return (
    <motion.div
      style={{ left: drop.x, top: drop.y, width: drop.size, height: drop.size, x, y }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 + drop.delay * 0.4 }}
      className="absolute origin-center scale-[0.55] translate-x-[18%] md:scale-100 md:translate-x-0"
    >
      <motion.div
        className="liquid-glass h-full w-full"
        style={{ borderRadius: drop.radius }}
        animate={
          reduced
            ? undefined
            : {
                y: [0, -18 * (1 / drop.depth) - 6, 0],
                rotate: [0, drop.depth % 2 ? 6 : -6, 0],
                borderRadius: [drop.radius, '50% 50% 45% 55% / 55% 45% 55% 45%', drop.radius],
              }
        }
        transition={{ duration: drop.duration, repeat: Infinity, ease: 'easeInOut', delay: drop.delay }}
      />
    </motion.div>
  )
}
