import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt, decrypt } from '@/lib/session'

const COOKIE = 'session'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS)
  const token = await encrypt({ sub: userId })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}

// Lê e valida a sessão do cookie. Não redireciona — retorna { userId } ou null.
export const getSession = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value
  const payload = await decrypt(token)
  return typeof payload?.sub === 'string' ? { userId: payload.sub } : null
})

// DAL: usar em páginas/actions protegidas. Redireciona se não autenticado.
export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }
  return { userId: session.userId }
})
