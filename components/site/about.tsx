'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Scene } from '@/components/three/scene'
import { Reveal } from '@/components/motion/reveal'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

const STATEMENT =
  'Мы не делаем «просто сайты». Мы проектируем опыт, в котором каждая деталь — от микроанимации до архитектуры данных — работает на одну цель: чтобы ваш бренд запомнили.'

const STATS = [
  { value: '8', suffix: ' лет', label: 'создаём digital-продукты' },
  { value: '120', suffix: '+', label: 'запущенных проектов' },
  { value: '14', suffix: '', label: 'международных наград' },
  { value: '97', suffix: '%', label: 'клиентов возвращаются' },
]

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const start = index / total
  const end = start + 1.6 / total
  const opacity = useTransform(progress, [start, end], [0.18, 1])
  const blur = useTransform(progress, [start, end], [6, 0])
  const filter = useTransform(blur, (b) => `blur(${b}px)`)
  const y = useTransform(progress, [start, end], [10, 0])
  return (
    <motion.span style={{ opacity, filter, y }} className="inline-block will-change-[filter,opacity]">
      {word}&nbsp;
    </motion.span>
  )
}

export function About() {
  const ref = useRef<HTMLElement>(null)
  const statementRef = useRef<HTMLParagraphElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] })
  // Word reveal tracks only the statement itself so it fully resolves while the text is on screen
  const { scrollYProgress: statementProgress } = useScroll({
    target: statementRef,
    offset: ['start 92%', 'end 55%'],
  })
  const objectY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [140, -180])
  const objectRotate = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-8, 10])
  const words = STATEMENT.split(' ')

  return (
    <section ref={ref} id="about" className="relative overflow-hidden py-28 md:py-40">
      <div
        className="absolute right-0 top-1/2 h-[80vh] w-[80vh] -translate-y-1/2 translate-x-1/3 rounded-full bg-[radial-gradient(circle,rgba(79,124,255,0.16),transparent_65%)] blur-3xl"
        aria-hidden
      />

      <div className="mx-auto grid w-full max-w-7xl gap-16 px-6 md:px-10 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
        <div className="flex flex-col gap-12">
          <Reveal className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-8 bg-primary" />О нас
          </Reveal>

          <p
            ref={statementRef}
            className="font-display text-[clamp(1.6rem,3.6vw,3.2rem)] font-medium leading-[1.2] tracking-tight text-pretty"
          >
            {reduced
              ? STATEMENT
              : words.map((w, i) => (
                  <Word key={i} word={w} index={i} total={words.length} progress={statementProgress} />
                ))}
          </p>

          <Reveal delay={0.1} className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Gradpro — команда стратегов, дизайнеров и инженеров. Мы совмещаем эстетику
            премиального уровня с измеримыми бизнес-результатами: конверсией, удержанием
            и ростом стоимости бренда.
          </Reveal>

          <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08} className="flex flex-col gap-2 border-t border-border pt-5">
                <dd className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                  {s.value}
                  <span className="text-primary">{s.suffix}</span>
                </dd>
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
              </Reveal>
            ))}
          </dl>
        </div>

        <motion.div
          style={{ y: objectY, rotate: objectRotate }}
          className="relative hidden aspect-square w-full lg:block"
        >
          <Scene variant="sphere" className="h-full w-full" lazy parallax={0} />
          <div className="glass absolute bottom-6 left-6 rounded-2xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Основано</p>
            <p className="font-display text-2xl font-semibold">2026</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
