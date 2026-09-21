import { Header } from '@/components/site/header'
import { GlowButton } from '@/components/motion/glow-button'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
        <p className="font-display text-[clamp(5rem,20vw,14rem)] font-bold leading-none tracking-tighter text-gradient-violet">
          404
        </p>
        <h1 className="font-display text-2xl font-semibold">Такой страницы нет</h1>
        <p className="max-w-sm text-muted-foreground">
          Похоже, вы свернули не туда. Вернёмся на главную?
        </p>
        <GlowButton href="/">На главную</GlowButton>
      </main>
    </>
  )
}
