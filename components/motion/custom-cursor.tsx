'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useIsTouch, useReducedMotion } from '@/hooks/use-motion-prefs'

type CursorMode = 'default' | 'link' | 'open' | 'drag' | 'text' | 'hidden'

const LABELS: Record<CursorMode, string> = {
  default: '',
  link: '',
  open: 'Открыть',
  drag: 'Drag',
  text: '',
  hidden: '',
}

export function CustomCursor() {
  const isTouch = useIsTouch()
  const reduced = useReducedMotion()
  const [mode, setMode] = useState<CursorMode>('default')
  const [visible, setVisible] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [label, setLabel] = useState('')

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 })
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (isTouch) {
      document.documentElement.classList.remove('has-custom-cursor')
      return
    }
    document.documentElement.classList.add('has-custom-cursor')

    const onMove = (e: MouseEvent) => {
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(() => {
        x.set(e.clientX)
        y.set(e.clientY)
        if (!visible) setVisible(true)
      })
    }
    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-cursor], a, button, input, textarea, select, label, [role="button"]',
      )
      if (!target) {
        setMode('default')
        setLabel('')
        return
      }
      const custom = target.dataset.cursor as CursorMode | undefined
      if (custom) {
        setMode(custom)
        setLabel(target.dataset.cursorLabel ?? LABELS[custom])
        return
      }
      if (target.matches('input, textarea, select')) {
        setMode('text')
        setLabel('')
        return
      }
      setMode('link')
      setLabel('')
    }
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [isTouch, visible, x, y])

  if (isTouch) return null

  const hasLabel = mode === 'open' || mode === 'drag'
  const ringSize = hasLabel ? 96 : mode === 'link' ? 56 : mode === 'text' ? 28 : 40
  const dotScale = mode === 'text' ? 0.3 : hasLabel ? 0 : pressed ? 0.6 : 1

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] mix-blend-normal"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
    >
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          backgroundColor: hasLabel ? 'rgba(200,255,31,0.96)' : 'rgba(200,255,31,0)',
          borderColor: hasLabel
            ? 'rgba(200,255,31,0)'
            : mode === 'link'
              ? 'rgba(200,255,31,0.8)'
              : 'rgba(255,255,255,0.35)',
          scale: pressed ? 0.88 : 1,
        }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: 'spring', stiffness: 300, damping: 26, mass: 0.7 }
        }
      >
        <motion.span
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground"
          animate={{ opacity: hasLabel ? 1 : 0, scale: hasLabel ? 1 : 0.7 }}
          transition={{ duration: 0.25 }}
        >
          {label}
        </motion.span>
      </motion.div>
      <motion.div
        className="absolute left-0 top-0 h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_rgba(200,255,31,0.9)]"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ scale: dotScale }}
        transition={{ duration: 0.2 }}
      />
    </div>
  )
}
