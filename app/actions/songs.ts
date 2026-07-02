'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { SongSchema } from '@/lib/validations/song'

export type SongFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? undefined : s
}

function num(v: FormDataEntryValue | null): number | undefined {
  const s = str(v)
  if (s === undefined) return undefined
  const n = Number(s)
  return Number.isNaN(n) ? undefined : n
}

function parseSongForm(formData: FormData) {
  const genresRaw = str(formData.get('genres'))
  return {
    title: str(formData.get('title')) ?? '',
    artist: str(formData.get('artist')) ?? '',
    key: str(formData.get('key')) ?? '',
    genres: genresRaw
      ? genresRaw.split(',').map((g) => g.trim()).filter(Boolean)
      : [],
    version: str(formData.get('version')),
    capo: num(formData.get('capo')),
    tuning: str(formData.get('tuning')) ?? 'standard',
    bpm: num(formData.get('bpm')),
    difficulty: num(formData.get('difficulty')),
    status: str(formData.get('status')),
    chordFormat: str(formData.get('chordFormat')),
    chordContent: String(formData.get('chordContent') ?? ''),
    referenceYoutubeUrl: str(formData.get('referenceYoutubeUrl')),
    notes: str(formData.get('notes')),
  }
}

export async function createSong(
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await verifySession()
  const parsed = SongSchema.safeParse(parseSongForm(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const song = await prisma.song.create({ data: parsed.data })
  revalidatePath('/songs')
  redirect(`/songs/${song.id}`)
}

export async function updateSong(
  id: string,
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await verifySession()
  const parsed = SongSchema.safeParse(parseSongForm(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  await prisma.song.update({ where: { id }, data: parsed.data })
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
