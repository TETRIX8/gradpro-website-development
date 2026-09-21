import { redirect } from 'next/navigation'
import { getSession, hasAnyUser } from '@/lib/admin'
import { SignInForm } from '@/components/admin/sign-in-form'

export const metadata = { title: 'Вход — Gradpro Admin' }
export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  const session = await getSession()
  if (session?.user) redirect('/admin')
  const registrationOpen = !(await hasAnyUser())

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-16">
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div
        className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.2),transparent_65%)] blur-3xl"
        aria-hidden
      />
      <SignInForm registrationOpen={registrationOpen} />
    </main>
  )
}
