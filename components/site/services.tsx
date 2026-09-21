'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ServicesScene } from '@/components/three/services-scene'
import { EASE_OUT, Reveal, SplitWords } from '@/components/motion/reveal'

const SERVICES = [
  {
    title: 'Стратегия и аналитика',
    short: 'Понимаем рынок до первого пикселя',
    text: 'Исследуем аудиторию, конкурентов и точки роста. Формируем позиционирование, CJM и метрики успеха, чтобы каждое дизайн-решение опиралось на данные.',
    tags: ['Research', 'CJM', 'Positioning'],
  },
  {
    title: 'UX/UI-дизайн',
    short: 'Интерфейсы, которые чувствуются',
    text: 'Проектируем сценарии, прототипируем и полируем каждое состояние. Дизайн-системы, которые масштабируются вместе с продуктом.',
    tags: ['Figma', 'Design Systems', 'Prototyping'],
  },
  {
    title: '3D и motion',
    short: 'Глубина, свет и движение',
    text: 'WebGL-сцены, генеративная графика, микроанимации и кинематографичные переходы. Оптимизируем под 60 fps и мобильные устройства.',
    tags: ['Three.js', 'GSAP', 'Blender'],
  },
  {
    title: 'Разработка',
    short: 'Инженерия премиального уровня',
    text: 'Next.js, React, headless CMS, интеграции и безопасность. Код, который проходит аудит и живёт годами.',
    tags: ['Next.js', 'TypeScript', 'Headless'],
  },
  {
    title: 'Брендинг',
    short: 'Айдентика от идеи до гайдлайна',
    text: 'Логотип, типографика, цвет, тон коммуникации и брендбук. Создаём визуальный язык, который узнают с первого взгляда.',
    tags: ['Identity', 'Guidelines', 'Tone of Voice'],
  },
  {
    title: 'Поддержка и рост',
    short: 'Продукт живёт после запуска',
    text: 'SLA-поддержка, A/B-тесты, аналитика и постоянные улучшения. Помогаем расти, а не просто чинить.',
    tags: ['SLA', 'A/B', 'Analytics'],
  },
]

export function Services() {
  const [active, setActive] = useState(0)

  return (
    <section id="services" className="relative py-28 md:py-40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Reveal className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" />
              Услуги
            </Reveal>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.8rem)] font-bold leading-[1.02] tracking-tight text-balance">
              <SplitWords text={'Полный цикл —\nот идеи до роста'} highlight={['роста']} />
            </h2>
          </div>
          <Reveal className="max-w-sm text-muted-foreground" delay={0.15}>
            Шесть направлений, одна команда. Наведите на услугу — объект справа изменит форму.
          </Reveal>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="relative order-1 aspect-[4/3] lg:order-2 lg:sticky lg:top-28 lg:aspect-square lg:self-start">
            <div
              className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_60%,rgba(167,139,250,0.14),transparent_60%)]"
              aria-hidden
            />
            <ServicesScene active={active} className="h-full w-full" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="glass absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl px-5 py-3 md:bottom-6 md:left-6 md:right-auto"
              >
                <span className="text-sm text-muted-foreground">{SERVICES[active].short}</span>
                <span className="ml-6 font-display text-sm text-primary">0{active + 1}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <ul className="order-2 flex flex-col lg:order-1" role="list">
            {SERVICES.map((s, i) => {
              const isOpen = active === i
              return (
                <li key={s.title} className="border-t border-border last:border-b">
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-expanded={isOpen}
                    aria-controls={`service-panel-${i}`}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="flex items-baseline gap-5">
                      <span
                        className={cn(
                          'font-display text-xs tabular-nums transition-colors duration-500',
                          isOpen ? 'text-primary' : 'text-muted-foreground/60',
                        )}
                      >
                        0{i + 1}
                      </span>
                      <span
                        className={cn(
                          'font-display text-2xl font-semibold tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:text-3xl',
                          isOpen ? 'translate-x-2 text-foreground' : 'text-foreground/70 group-hover:text-foreground',
                        )}
                      >
                        {s.title}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                        isOpen
                          ? 'rotate-45 border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`service-panel-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.55, ease: EASE_OUT }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-5 pb-7 pl-12 pr-16">
                          <p className="text-muted-foreground leading-relaxed">{s.text}</p>
                          <ul className="flex flex-wrap gap-2" aria-label="Инструменты">
                            {s.tags.map((t) => (
                              <li
                                key={t}
                                className="rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-foreground/80"
                              >
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
