'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/components/motion/reveal'

const input =
  'w-full rounded-2xl border border-border bg-input px-5 py-4 text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/40'

export function SignInForm({ registrationOpen }: { registrationOpen: boolean }) {
  const router = useRouter()
  const [mode, setMode] = useState<'in' | 'up'>(registrationOpen ? 'up' : 'in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    if (password.length < 8) {
      toast.error('Пароль — минимум 8 символов')
      return
    }
    setPending(true)
    try {
      const res =
        mode === 'up'
          ? await authClient.signUp.email({ name: name || 'Admin', email, password })
          : await authClient.signIn.email({ email, password })
      if (res.error) {
        toast.error(res.error.message ?? 'Не удалось войти')
        return
      }
      toast.success(mode === 'up' ? 'Аккаунт создан' : 'Добро пожаловать')
      router.push('/admin')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      className="glass relative w-full max-w-md rounded-[2rem] p-8 md:p-10"
    >
      <p className="font-display text-lg font-bold tracking-[0.18em]">
        GRAD<span className="text-primary">PRO</span>
      </p>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
        {mode === 'up' ? 'Создать админ-аккаунт' : 'Вход в админ-панель'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === 'up'
          ? 'Это первый вход. Создайте единственный аккаунт администратора.'
          : 'Управление проектами и заявками.'}
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        {mode === 'up' && (
          <input
            aria-label="Имя"
            placeholder="Имя"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
          />
        )}
        <input
          aria-label="Email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <input
          aria-label="Пароль"
          type="password"
          placeholder="Пароль (минимум 8 символов)"
          autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            'mt-2 flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground transition-all hover:shadow-[0_0_40px_rgba(200,255,31,0.35)] disabled:opacity-60',
          )}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {mode === 'up' ? 'Создать аккаунт' : 'Войти'}
        </button>
      </form>

      {registrationOpen && (
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'up' ? 'in' : 'up'))}
          className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {mode === 'up' ? 'У меня уже есть аккаунт' : 'Создать первый аккаунт'}
        </button>
      )}
    </motion.div>
  )
}
