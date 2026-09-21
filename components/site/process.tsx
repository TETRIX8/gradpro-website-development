'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { Reveal, SplitWords, EASE_OUT } from '@/components/motion/reveal'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

const STEPS = [
  {
    title: 'Discovery',
    text: 'Погружаемся в бизнес, аудиторию и цели. Формируем гипотезы и метрики.',
    days: '1–2 недели',
  },
  {
    title: 'Стратегия',
    text: 'Позиционирование, структура, сценарии. Согласуем архитектуру решения.',
    days: '1 неделя',
  },
  {
    title: 'Дизайн',
    text: 'Концепция, UI-кит, 3D и motion-прототипы. Итерации до идеального состояния.',
    days: '3–5 недель',
  },
  {
    title: 'Разработка',
    text: 'Frontend, backend, CMS, интеграции. Тесты производительности и доступности.',
    days: '4–8 недель',
  },
  {
    title: 'Запуск и рост',
    text: 'Деплой, аналитика, A/B-эксперименты. Поддержка и развитие продукта.',
    days: 'постоянно',
  },
]

export function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 45%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.6 })
  const lineScale = reduced ? 1 : progress
  const beadPos = useTransform(progress, (v) => `${Math.min(100, Math.max(0, v * 100))}%`)

  return (
    <section id="process" className="relative overflow-hidden py-28 md:py-40">
      <div
        className="absolute left-1/2 top-1/2 h-[70vh] w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(200,255,31,0.06),transparent_60%)] blur-3xl"
        aria-hidden
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Reveal className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" />
              Процесс
            </Reveal>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.8rem)] font-bold leading-[1.02] tracking-tight text-balance">
              <SplitWords text={'Пять шагов\nк результату'} highlight={['результату']} />
            </h2>
          </div>
          <Reveal className="max-w-sm text-muted-foreground" delay={0.15}>
            Прозрачный процесс без сюрпризов: вы видите прогресс на каждом этапе.
          </Reveal>
        </div>

        <div ref={ref} className="relative">
          {/* Desktop horizontal track */}
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-border lg:block" aria-hidden>
            <motion.div
              style={{ scaleX: lineScale }}
              className="h-full origin-left bg-gradient-to-r from-primary via-accent to-electric shadow-[0_0_18px_rgba(200,255,31,0.5)]"
            />
            <motion.div
              style={{ left: beadPos }}
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffffff,#d6d8e2_35%,#5a5d6e_70%,#20222b)] shadow-[0_0_28px_rgba(200,255,31,0.75)]"
            />
          </div>

          {/* Mobile vertical track */}
          <div className="absolute bottom-0 left-6 top-0 w-px bg-border lg:hidden" aria-hidden>
            <motion.div
              style={{ scaleY: lineScale }}
              className="h-full w-full origin-top bg-gradient-to-b from-primary via-accent to-electric"
            />
            <motion.div
              style={{ top: beadPos }}
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffffff,#d6d8e2_35%,#5a5d6e_70%,#20222b)] shadow-[0_0_22px_rgba(200,255,31,0.75)]"
            />
          </div>

          <ol className="flex flex-col gap-10 lg:grid lg:grid-cols-5 lg:gap-6" role="list">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                initial={reduced ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: i * 0.1 }}
                className="relative flex gap-6 pl-16 lg:flex-col lg:gap-8 lg:pl-0"
              >
                <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background font-display text-sm text-primary lg:relative lg:h-12 lg:w-12">
                  0{i + 1}
                </span>
                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">{s.days}</span>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
