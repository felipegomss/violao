'use server'

import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { SongSchema } from '@/lib/validations/song'
import { parseDirectives } from '@/lib/song/directives'
import { slugify, uniqueSlug } from '@/lib/slug'
import { canonicalTerms } from '@/lib/song/terms'

export type SongFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

// Normaliza gêneros/artistas contra o que já existe no acervo do usuário —
// adota a grafia existente (evita "samba" duplicar "Samba").
async function canonical(userId: string, genres: string[], artists: string[], excludeId?: string) {
  const others = await prisma.song.findMany({
    where: { userId, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { genres: true, artists: true },
  })
  return {
    genres: canonicalTerms(genres, others.flatMap((o) => o.genres)),
    artists: canonicalTerms(artists, others.flatMap((o) => o.artists)),
  }
}

export async function createSong(
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  const { userId } = await verifySession()
  const chordContent = String(formData.get('chordContent') ?? '')
  const parsed = SongSchema.safeParse(parseDirectives(chordContent))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const slug = await uniqueSlug(
    slugify(parsed.data.title),
    async (s) => (await prisma.song.count({ where: { userId, slug: s } })) > 0,
  )
  const terms = await canonical(userId, parsed.data.genres, parsed.data.artists)
  const song = await prisma.song.create({
    data: { ...parsed.data, ...terms, chordContent, userId, slug },
  })
  revalidatePath('/songs')
  redirect(`/songs/${song.slug}`)
}

export async function updateSong(
  id: string,
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  const { userId } = await verifySession()
  const chordContent = String(formData.get('chordContent') ?? '')
  const parsed = SongSchema.safeParse(parseDirectives(chordContent))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const terms = await canonical(userId, parsed.data.genres, parsed.data.artists, id)
  const { count } = await prisma.song.updateMany({
    where: { id, userId },
    data: { ...parsed.data, ...terms, chordContent },
  })
  if (count === 0) notFound()
  // slug é estável (não muda no rename) — busco pra redirecionar pela URL bonita.
  const s = await prisma.song.findFirst({ where: { id, userId }, select: { slug: true } })
  revalidatePath('/songs')
  revalidatePath(`/songs/${s?.slug}`)
  redirect(`/songs/${s?.slug ?? ''}`)
}

export async function deleteSong(id: string) {
  const { userId } = await verifySession()
  await prisma.song.deleteMany({ where: { id, userId } })
  revalidatePath('/songs')
  redirect('/songs')
}

// Autoavaliação "como estou tocando" (1–5), marcada na view da cifra.
export async function setComoEstouTocando(id: string, value: number) {
  const { userId } = await verifySession()
  const v = Math.min(5, Math.max(1, Math.round(value)))
  await prisma.song.updateMany({ where: { id, userId }, data: { comoEstouTocando: v } })
  revalidatePath('/songs')
  revalidatePath('/songs/[slug]', 'page')
}

// Digitação escolhida por acorde ("variar acorde"), persistida por música.
// Recebe o mapa inteiro { acorde: índice } e substitui — sem revalidar (é
// preferência de view, aplicada no client; a página relê no próximo acesso).
export async function saveVoicings(id: string, voicings: Record<string, number>) {
  const { userId } = await verifySession()
  const clean: Record<string, number> = {}
  for (const [name, idx] of Object.entries(voicings)) {
    if (typeof idx === 'number' && Number.isInteger(idx) && idx > 0) clean[name] = idx
  }
  await prisma.song.updateMany({ where: { id, userId }, data: { voicings: clean } })
}
