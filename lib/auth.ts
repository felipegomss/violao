import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt, decrypt } from '@/lib/session'

const COOKIE = 'session'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

// Monta o descriptor do cookie de sessão. Usado pelo Server Action
// (createSession) e pelo route handler do magic link — que precisa setar o
// cookie DIRETO no NextResponse.redirect, senão o Set-Cookie se perde.
export async function buildSessionCookie(userId: string) {
  const token = await encrypt({ sub: userId })
  return {
    name: COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + MAX_AGE_MS),
      sameSite: 'lax' as const,
      path: '/',
    },
  }
}

export async function createSession(userId: string) {
  const { name, value, options } = await buildSessionCookie(userId)
  const cookieStore = await cookies()
  cookieStore.set(name, value, options)
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
