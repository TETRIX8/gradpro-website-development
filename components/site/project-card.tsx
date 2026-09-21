'use client'

import { useRef, type MouseEvent } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { Project } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { TransitionLink } from '@/components/motion/page-transition'
import { EASE_OUT } from '@/components/motion/reveal'
import { useIsTouch, useReducedMotion } from '@/hooks/use-motion-prefs'

const ACCENT_GLOW: Record<string, string> = {
  lime: 'rgba(200,255,31,0.28)',
  violet: 'rgba(167,139,250,0.32)',
  blue: 'rgba(79,124,255,0.32)',
}

export function ProjectCard({
  project,
  index,
  large = false,
}: {
  project: Project
  index: number
  large?: boolean
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const isTouch = useIsTouch()
  const reduced = useReducedMotion()

  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 180, damping: 20 })
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 180, damping: 20 })
  const glowX = useTransform(mx, (v) => `${v * 100}%`)
  const glowY = useTransform(my, (v) => `${v * 100}%`)

  const onMove = (e: MouseEvent) => {
    if (isTouch || reduced || !wrapper.current) return
    const r = wrapper.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  const glow = ACCENT_GLOW[project.accent] ?? ACCENT_GLOW.lime
  const glowBg = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(420px circle at ${x} ${y}, ${glow}, transparent 60%)`,
  )

  return (
    <motion.div
      ref={wrapper}
      variants={{ hidden: { opacity: 0, y: 60 }, show: { opacity: 1, y: 0 } }}
      initial={reduced ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: EASE_OUT, delay: (index % 2) * 0.12 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1200 }}
      className={cn(large && 'md:col-span-2')}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
        <TransitionLink
          href={`/projects/${project.slug}`}
          originRef={ref}
          data-cursor="open"
          aria-label={`Открыть проект ${project.title}`}
          className={cn(
            'group relative block overflow-hidden rounded-[1.75rem] border border-border bg-card',
            large ? 'aspect-[16/8]' : 'aspect-[4/3]',
          )}
        >
          <span ref={ref} className="absolute inset-0" aria-hidden />
          {/* Clip is driven by the parent's variants: a fully clipped element never intersects on its own */}
          <motion.div
            variants={{
              hidden: { clipPath: 'inset(0% 0% 100% 0%)' },
              show: { clipPath: 'inset(0% 0% 0% 0%)' },
            }}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.1 }}
            className="absolute inset-0"
          >
            <Image
              src={project.coverUrl}
              alt={`Обложка проекта ${project.title}`}
              fill
              sizes={large ? '(max-width: 768px) 100vw, 1200px' : '(max-width: 768px) 100vw, 600px'}
              className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
              priority={index < 2}
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-100" />

          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: glowBg }}
          />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 md:p-7">
            <span className="glass rounded-full px-3 py-1 text-xs font-medium tracking-wide">
              {project.category}
            </span>
            <span className="font-display text-xs text-muted-foreground">{project.year}</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-7">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                {project.title}
              </h3>
              <p className="max-w-md text-sm text-muted-foreground transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                {project.tagline}
              </p>
              <ul className="hidden flex-wrap gap-2 pt-1 transition-all delay-75 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                {project.technologies.slice(0, 4).map((t) => (
                  <li key={t} className="rounded-full border border-border/80 px-2.5 py-0.5 text-[11px] text-foreground/80">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-45 group-hover:scale-110">
              <ArrowUpRight className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </TransitionLink>
      </motion.div>
    </motion.div>
  )
}
