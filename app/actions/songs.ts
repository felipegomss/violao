'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { SongSchema } from '@/lib/validations/song'
import { parseDirectives } from '@/lib/song/directives'

export type SongFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

export async function createSong(
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await verifySession()
  const chordContent = String(formData.get('chordContent') ?? '')
  const parsed = SongSchema.safeParse(parseDirectives(chordContent))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const song = await prisma.song.create({
    data: { ...parsed.data, chordContent },
  })
  revalidatePath('/songs')
  redirect(`/songs/${song.id}`)
}

export async function updateSong(
  id: string,
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await verifySession()
  const chordContent = String(formData.get('chordContent') ?? '')
  const parsed = SongSchema.safeParse(parseDirectives(chordContent))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  await prisma.song.update({
    where: { id },
    data: { ...parsed.data, chordContent },
  })
  revalidatePath('/songs')
  revalidatePath(`/songs/${id}`)
  redirect(`/songs/${id}`)
}

export async function deleteSong(id: string) {
  await verifySession()
  await prisma.song.delete({ where: { id } })
  revalidatePath('/songs')
  redirect('/songs')
}

// Autoavaliação "como estou tocando" (1–5), marcada na view da cifra.
export async function setComoEstouTocando(id: string, value: number) {
  await verifySession()
  const v = Math.min(5, Math.max(1, Math.round(value)))
  await prisma.song.update({ where: { id }, data: { comoEstouTocando: v } })
  revalidatePath('/songs')
  revalidatePath(`/songs/${id}`)
}
