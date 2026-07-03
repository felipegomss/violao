'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

const NameSchema = z.string().trim().min(1, 'Coloca um nome.').max(60)

export type NameState = { error?: string; ok?: boolean } | undefined

export async function setName(_prev: NameState, formData: FormData): Promise<NameState> {
  const { userId } = await verifySession()
  const parsed = NameSchema.safeParse(String(formData.get('name') ?? ''))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Nome inválido.' }
  }
  await prisma.user.update({ where: { id: userId }, data: { name: parsed.data } })
  revalidatePath('/', 'layout')
  return { ok: true }
}
