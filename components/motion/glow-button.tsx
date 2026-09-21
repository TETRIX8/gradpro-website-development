'use client'

import { type ComponentProps, type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Magnetic } from './magnetic'
import { TransitionLink } from './page-transition'

type Variant = 'primary' | 'ghost' | 'violet'

type BaseProps = {
  children: ReactNode
  variant?: Variant
  className?: string
  icon?: boolean
}

type ButtonProps = BaseProps & ComponentProps<'button'> & { href?: undefined }
type LinkProps = BaseProps & { href: string; onClick?: () => void }

const base =
  'group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-7 py-4 font-sans text-sm font-semibold tracking-wide transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-[0_0_0_rgba(200,255,31,0)] hover:shadow-[0_0_48px_rgba(200,255,31,0.35)]',
  ghost:
    'glass text-foreground hover:shadow-[0_0_40px_rgba(167,139,250,0.18)]',
  violet:
    'bg-accent text-accent-foreground hover:shadow-[0_0_48px_rgba(167,139,250,0.4)]',
}

function Inner({ children, variant, icon }: BaseProps) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 -translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0',
          variant === 'primary' &&
            'bg-[linear-gradient(100deg,#e6ff7a,#c8ff1f_50%,#a78bfa)]',
          variant === 'ghost' &&
            'bg-[linear-gradient(100deg,rgba(200,255,31,0.16),rgba(167,139,250,0.16))]',
          variant === 'violet' &&
            'bg-[linear-gradient(100deg,#c4b5fd,#a78bfa_50%,#4f7cff)]',
        )}
      />
      <span className="relative z-10">{children}</span>
      {icon && (
        <ArrowUpRight
          className="relative z-10 h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:rotate-12"
          aria-hidden
        />
      )}
    </>
  )
}

export function GlowButton(props: ButtonProps | LinkProps) {
  const { children, variant = 'primary', className, icon = true } = props
  const classes = cn(base, variants[variant], className)

  if ('href' in props && props.href) {
    return (
      <Magnetic className="inline-block">
        <TransitionLink href={props.href} className={classes} onClick={props.onClick}>
          <Inner variant={variant} icon={icon}>
            {children}
          </Inner>
        </TransitionLink>
      </Magnetic>
    )
  }

  const { href: _h, variant: _v, icon: _i, className: _c, ...rest } =
    props as ButtonProps
  return (
    <Magnetic className="inline-block">
      <button className={classes} {...rest}>
        <Inner variant={variant} icon={icon}>
          {children}
        </Inner>
      </button>
    </Magnetic>
  )
}
