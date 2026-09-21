'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { Scene } from '@/components/three/scene'
import { GlowButton } from '@/components/motion/glow-button'
import { EASE_OUT, SplitWords } from '@/components/motion/reveal'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

const TRUST = ['Awwwards', 'CSS Design Awards', 'Behance', 'Red Dot', 'FWA']

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -120])
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.25])
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.15])

  return (
    <section
      ref={ref}
      id="hero"
      className="noise relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-28 md:pt-24"
    >
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div
        className="absolute -left-1/4 top-1/3 h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.22),transparent_65%)] blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -right-1/4 top-0 h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(200,255,31,0.16),transparent_65%)] blur-3xl"
        aria-hidden
      />

      <motion.div
        style={{ scale: sceneScale, opacity: sceneOpacity }}
        className="pointer-events-auto absolute inset-y-0 right-0 w-full md:left-[46%] md:w-[54%]"
      >
        {/* On phones the object sits behind the copy, so it is shrunk, pushed up-right and dimmed */}
        <div className="h-full w-full origin-top-right scale-[0.62] opacity-40 [mask-image:linear-gradient(to_bottom,black_40%,transparent_95%)] md:scale-100 md:opacity-100 md:[mask-image:none]">
          <Scene variant="blob" className="h-full w-full" deferMs={250} />
        </div>
      </motion.div>

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-24 md:px-10 lg:gap-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
          className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
        >
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(200,255,31,0.9)] animate-pulse-soft" />
          Digital-агентство полного цикла
        </motion.div>

        <h1 className="max-w-4xl font-display text-[clamp(2.4rem,7vw,6.2rem)] font-bold leading-[0.98] tracking-tight text-balance">
          <SplitWords
            text={'Создаём сайты,\nкоторые невозможно забыть'}
            highlight={['невозможно', 'забыть']}
            animateOnMount
            stagger={0.07}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.9 }}
          className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          Стратегия, дизайн, 3D и разработка. Мы превращаем бренды в цифровой опыт,
          который хочется трогать, листать и показывать друзьям.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 1.05 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <GlowButton href="/#contact">Обсудить проект</GlowButton>
          <GlowButton href="/#projects" variant="ghost">
            Смотреть проекты
          </GlowButton>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          aria-label="Награды и площадки"
          className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/70"
        >
          {TRUST.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.a
        href="/#about"
        aria-label="Прокрутить вниз"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-8 left-6 z-10 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground md:left-10"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden />
        </span>
        Scroll
      </motion.a>
    </section>
  )
}
