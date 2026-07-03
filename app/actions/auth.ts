'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/session'
import { createSession, deleteSession } from '@/lib/auth'

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

export async function logout() {
  await deleteSession()
  redirect('/login')
}
