'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Magnetic } from '@/components/motion/magnetic'
import { TransitionLink } from '@/components/motion/page-transition'
import { EASE_OUT } from '@/components/motion/reveal'

const NAV = [
  { label: 'Услуги', href: '/#services' },
  { label: 'Проекты', href: '/#projects' },
  { label: 'Процесс', href: '/#process' },
  { label: 'Отзывы', href: '/#testimonials' },
  { label: 'Контакты', href: '/#contact' },
]

export function Logo({ className }: { className?: string }) {
  return (
    <TransitionLink
      href="/"
      className={cn('font-display text-lg font-bold tracking-[0.18em]', className)}
      aria-label="Gradpro — на главную"
    >
      GRAD<span className="text-primary">PRO</span>
    </TransitionLink>
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.2 }}
        className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 md:px-6"
      >
        <nav
          aria-label="Основная навигация"
          className={cn(
            'flex w-full max-w-7xl items-center justify-between rounded-full px-5 py-3 transition-all duration-500 md:px-6',
            scrolled || open ? 'glass shadow-[0_10px_40px_rgba(0,0,0,0.35)]' : 'border border-transparent',
          )}
        >
          <Logo />

          <ul className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="group relative px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                  <span className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Magnetic strength={0.25}>
              <a
                href="/#contact"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow duration-500 hover:shadow-[0_0_36px_rgba(200,255,31,0.4)]"
              >
                Обсудить проект
              </a>
            </Magnetic>
          </div>

          <button
            type="button"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full md:hidden"
          >
            <span
              className={cn(
                'absolute h-0.5 w-5 bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                open ? 'rotate-45' : '-translate-y-1.5',
              )}
            />
            <span
              className={cn(
                'absolute h-0.5 w-5 bg-foreground transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                open ? '-rotate-45' : 'translate-y-1.5',
              )}
            />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ clipPath: 'circle(0% at 92% 6%)' }}
            animate={{ clipPath: 'circle(150% at 92% 6%)' }}
            exit={{ clipPath: 'circle(0% at 92% 6%)' }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="fixed inset-0 z-[90] flex flex-col justify-between bg-background/95 px-6 pb-10 pt-28 backdrop-blur-xl md:hidden"
          >
            <ul className="flex flex-col gap-2">
              {NAV.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: EASE_OUT }}
                >
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-display text-3xl font-semibold"
                  >
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.a
              href="/#contact"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: EASE_OUT }}
              className="flex items-center justify-center rounded-full bg-primary py-4 font-semibold text-primary-foreground"
            >
              Обсудить проект
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
