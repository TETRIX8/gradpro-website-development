'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, SplitWords, EASE_OUT } from '@/components/motion/reveal'

const ITEMS = [
  {
    quote:
      'Gradpro сделали то, что мы считали невозможным: сайт стал главным каналом продаж. Конверсия выросла в 3 раза за квартал.',
    name: 'Елена Соколова',
    role: 'CMO, NOVA',
    initials: 'ЕС',
    accent: 'from-lime to-violet',
  },
  {
    quote:
      'Редкое сочетание вкуса и инженерной дисциплины. Команда думала о бизнесе, а не только о красивых картинках.',
    name: 'Артём Ковалёв',
    role: 'Founder, AURA',
    initials: 'АК',
    accent: 'from-violet to-electric',
  },
  {
    quote:
      'Диспетчеры перестали жаловаться на интерфейс — впервые за пять лет. Это лучшая метрика, которую я могу назвать.',
    name: 'Мария Литвинова',
    role: 'Head of Product, SHIFT',
    initials: 'МЛ',
    accent: 'from-electric to-lime',
  },
  {
    quote:
      'Сайт ощущается как прогулка по нашему зданию. Клиенты пишут о нём чаще, чем о самих проектах.',
    name: 'Игорь Марченко',
    role: 'Партнёр, бюро MONO',
    initials: 'ИМ',
    accent: 'from-lime to-electric',
  },
]

export function Testimonials() {
  const track = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [index, setIndex] = useState(0)
  const [bounds, setBounds] = useState({ min: 0, step: 0 })

  useEffect(() => {
    const measure = () => {
      if (!track.current || !viewport.current) return
      const first = track.current.children[0] as HTMLElement | undefined
      const gap = 24
      const step = (first?.offsetWidth ?? 0) + gap
      const min = Math.min(0, viewport.current.offsetWidth - track.current.scrollWidth)
      setBounds({ min, step })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(ITEMS.length - 1, i))
    const target = Math.max(bounds.min, -clamped * bounds.step)
    animate(x, target, { type: 'spring', stiffness: 160, damping: 26 })
    setIndex(clamped)
  }

  return (
    <section id="testimonials" className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Reveal className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" />
              Отзывы
            </Reveal>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.8rem)] font-bold leading-[1.02] tracking-tight text-balance">
              <SplitWords text={'Клиенты говорят\nлучше нас'} highlight={['лучше']} />
            </h2>
          </div>
          <Reveal className="flex items-center gap-2" delay={0.15}>
            {ITEMS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Отзыв ${i + 1}`}
                aria-current={index === i}
                onClick={() => goTo(i)}
                className={cn(
                  'h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  index === i ? 'w-10 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground',
                )}
              />
            ))}
          </Reveal>
        </div>
      </div>

      <div ref={viewport} className="mx-auto mt-14 w-full max-w-7xl px-6 md:px-10" data-cursor="drag">
        <motion.div
          ref={track}
          drag="x"
          dragConstraints={{ left: bounds.min, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ bounceStiffness: 220, bounceDamping: 28 }}
          style={{ x }}
          onDragEnd={() => {
            const i = Math.round(-x.get() / (bounds.step || 1))
            setIndex(Math.max(0, Math.min(ITEMS.length - 1, i)))
          }}
          className="flex cursor-grab gap-6 active:cursor-grabbing"
        >
          {ITEMS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: i * 0.08 }}
              className="glass relative flex w-[85vw] shrink-0 select-none flex-col justify-between gap-10 rounded-[1.75rem] p-8 md:w-[520px] md:p-10"
            >
              <Quote className="h-8 w-8 text-primary/70" aria-hidden />
              <blockquote className="font-display text-xl font-medium leading-snug tracking-tight text-pretty md:text-2xl">
                {t.quote}
              </blockquote>
              <figcaption className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br font-display text-sm font-bold text-primary-foreground',
                    t.accent,
                  )}
                  aria-hidden
                >
                  {t.initials}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-sm text-muted-foreground">{t.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
