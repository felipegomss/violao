'use server'

import { redirect } from 'next/navigation'
import { verifyPassword } from '@/lib/session'
import { createSession, deleteSession } from '@/lib/auth'

export type LoginState = { error?: string } | undefined

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')
  if (!verifyPassword(password)) {
    return { error: 'Senha incorreta.' }
  }
  await createSession()
  redirect('/songs')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
