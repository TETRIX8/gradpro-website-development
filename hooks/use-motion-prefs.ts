'use client'

import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

export function useIsTouch() {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setTouch(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return touch
}

export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return mobile
}

export function useWebGL() {
  const [supported, setSupported] = useState<boolean | null>(null)
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      setSupported(Boolean(gl))
    } catch {
      setSupported(false)
    }
  }, [])
  return supported
}
