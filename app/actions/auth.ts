'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/session'
import { createSession, deleteSession } from '@/lib/auth'
import { generateToken, hashToken, TOKEN_TTL_MS } from '@/lib/tokens'
import { sendMagicLink } from '@/lib/email'

export type LoginState = { error?: string } | undefined

// TRANSITÓRIO — removido na Fase 5, junto com a senha. Mapeia a senha ao
// único usuário existente enquanto o magic link não entra.
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')
  if (!verifyPassword(password)) {
    return { error: 'Senha incorreta.' }
  }
  const user = await prisma.user.findFirst()
  if (!user) {
    return { error: 'Nenhuma conta configurada.' }
  }
  await createSession(user.id)
  redirect('/songs')
}

const EmailSchema = z.email()
export type MagicState = { sent?: boolean; error?: string } | undefined

export async function requestMagicLink(
  _prev: MagicState,
  formData: FormData,
): Promise<MagicState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!EmailSchema.safeParse(email).success) return { error: 'Email inválido.' }

  const since = new Date(Date.now() - TOKEN_TTL_MS)
  const recent = await prisma.magicLinkToken.count({ where: { email, createdAt: { gte: since } } })
  if (recent >= 5) return { sent: true } // rate-limit silencioso

  await prisma.magicLinkToken.deleteMany({ where: { email, usedAt: null } })
  const token = generateToken()
  await prisma.magicLinkToken.create({
    data: { email, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  })
  const url = `${process.env.APP_URL}/auth/verify?token=${token}`
  await sendMagicLink(email, url)
  return { sent: true }
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
