import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSession, hasAnyUser } from "@/lib/admin"
import { isStaffRole } from "@/lib/admin/rbac"
import { SignInForm } from "@/components/admin/sign-in-form"

export const metadata = { title: "Вход — Gradpro Admin", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const [session, sp, cookieStore] = await Promise.all([getSession(), searchParams, cookies()])
  const role = (session?.user as { role?: string } | undefined)?.role ?? "user"
  if (session?.user && isStaffRole(role)) redirect("/admin")
  const registrationOpen = !(await hasAnyUser())
  const dark = cookieStore.get("admin-theme")?.value !== "light"

  return (
    <div className={dark ? "dark" : undefined}>
      <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,92,245,0.22),transparent_65%)] blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -right-24 -top-24 h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(163,217,0,0.18),transparent_65%)] blur-3xl"
          aria-hidden
        />
        {session?.user && !isStaffRole(role) ? (
          <NoAccess email={session.user.email} />
        ) : (
          <SignInForm registrationOpen={registrationOpen} initialStep={sp.step === "2fa" ? "2fa" : undefined} />
        )}
      </main>
    </div>
  )
}

function NoAccess({ email }: { email: string }) {
  return (
    <div className="glass relative w-full max-w-md rounded-[2rem] p-8 text-center md:p-10">
      <p className="font-display text-lg font-bold tracking-[0.18em]">
        GRAD<span className="text-primary">PRO</span>
      </p>
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">Нет доступа к панели</h1>
      <p className="mt-3 text-sm text-muted-foreground text-pretty">
        Аккаунт <span className="font-medium text-foreground">{email}</span> не имеет роли сотрудника. Попросите администратора выдать права.
      </p>
      <form action="/api/auth/sign-out" method="post" className="mt-8">
        <a href="/" className="inline-flex h-12 items-center justify-center rounded-2xl border border-border px-6 text-sm font-medium transition hover:bg-muted">
          На сайт
        </a>
      </form>
    </div>
  )
}
