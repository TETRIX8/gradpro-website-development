import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireSession() {
  const session = await getSession()
  if (!session?.user) redirect('/admin/sign-in')
  return session
}

export async function hasAnyUser() {
  const { rows } = await pool.query<{ count: string }>('select count(*)::text as count from "user"')
  return Number(rows[0]?.count ?? 0) > 0
}
