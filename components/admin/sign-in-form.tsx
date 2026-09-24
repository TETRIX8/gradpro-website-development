"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { EASE_OUT } from "@/components/motion/reveal"

const input =
  "w-full rounded-2xl border border-border bg-input px-5 py-4 text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/40"

type Step = "credentials" | "2fa"

export function SignInForm({ registrationOpen, initialStep }: { registrationOpen: boolean; initialStep?: Step }) {
  const router = useRouter()
  const [mode, setMode] = useState<"in" | "up">(registrationOpen ? "up" : "in")
  const [step, setStep] = useState<Step>(initialStep ?? "credentials")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState("")
  const [useBackup, setUseBackup] = useState(false)
  const [trust, setTrust] = useState(true)
  const [pending, setPending] = useState(false)

  const finish = (msg: string) => {
    toast.success(msg)
    router.push("/admin")
    router.refresh()
  }

  const onCredentials = async (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    if (password.length < 8) {
      toast.error("Пароль — минимум 8 символов")
      return
    }
    setPending(true)
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ name: name.trim() || "Администратор", email, password })
        if (res.error) return toast.error(res.error.message ?? "Не удалось создать аккаунт")
        return finish("Аккаунт администратора создан")
      }
      const res = await authClient.signIn.email({ email, password })
      if (res.error) {
        const msg = res.error.status === 403 && /banned/i.test(res.error.message ?? "") ? "Аккаунт заблокирован" : "Неверный email или пароль"
        return toast.error(msg)
      }
      const data = res.data as { twoFactorRedirect?: boolean } | null
      if (data?.twoFactorRedirect) {
        setStep("2fa")
        return
      }
      finish("Добро пожаловать")
    } finally {
      setPending(false)
    }
  }

  const onCode = async (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    const clean = code.replace(/\s|-/g, "")
    if (!useBackup && clean.length !== 6) return toast.error("Введите 6-значный код")
    setPending(true)
    try {
      const res = useBackup
        ? await authClient.twoFactor.verifyBackupCode({ code: clean, trustDevice: trust })
        : await authClient.twoFactor.verifyTotp({ code: clean, trustDevice: trust })
      if (res.error) return toast.error("Код не подошёл. Проверьте время на устройстве и попробуйте ещё раз.")
      finish("Личность подтверждена")
    } finally {
      setPending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      className="glass relative w-full max-w-md rounded-[2rem] p-8 md:p-10"
    >
      <p className="font-display text-lg font-bold tracking-[0.18em]">
        GRAD<span className="text-primary">PRO</span>
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {step === "credentials" ? (
          <motion.div key="cred" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.25 }}>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-balance">
              {mode === "up" ? "Создать админ-аккаунт" : "Вход в админ-панель"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "up"
                ? "Это первый вход. Созданный аккаунт получит полные права администратора."
                : "Управление заявками, контентом и пользователями."}
            </p>

            <form onSubmit={onCredentials} className="mt-8 flex flex-col gap-4">
              {mode === "up" && (
                <input aria-label="Имя" placeholder="Имя" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
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
              <div className="relative">
                <input
                  aria-label="Пароль"
                  type={showPassword ? "text" : "password"}
                  placeholder="Пароль (минимум 8 символов)"
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(input, "pr-14")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  className="absolute right-4 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {mode === "up" ? "Создать аккаунт" : "Войти"}
              </button>
            </form>

            {!registrationOpen && (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                Нет доступа? Попросите администратора создать вам аккаунт в разделе «Пользователи».
              </p>
            )}
            {registrationOpen && mode === "up" && (
              <button type="button" onClick={() => setMode("in")} className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground">
                У меня уже есть аккаунт
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="2fa" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
            <div className="mt-6 grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              {useBackup ? <KeyRound className="size-6" /> : <ShieldCheck className="size-6" />}
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Двухфакторная проверка</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {useBackup ? "Введите один из резервных кодов." : "Откройте приложение-аутентификатор и введите 6-значный код."}
            </p>
            <form onSubmit={onCode} className="mt-8 flex flex-col gap-4">
              <input
                aria-label="Код подтверждения"
                inputMode={useBackup ? "text" : "numeric"}
                autoComplete="one-time-code"
                autoFocus
                placeholder={useBackup ? "xxxxx-xxxxx" : "000 000"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={cn(input, "text-center font-display text-2xl tracking-[0.3em]")}
              />
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} className="size-4 accent-[var(--primary)]" />
                Доверять этому устройству 30 дней
              </label>
              <button
                type="submit"
                disabled={pending}
                className="mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                Подтвердить
              </button>
            </form>
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <button type="button" onClick={() => { setStep("credentials"); setCode("") }} className="hover:text-foreground">
                Назад
              </button>
              <button type="button" onClick={() => { setUseBackup((v) => !v); setCode("") }} className="hover:text-foreground">
                {useBackup ? "Использовать код из приложения" : "Использовать резервный код"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
