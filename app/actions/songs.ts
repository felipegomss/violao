'use server'

import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { SongSchema } from '@/lib/validations/song'
import { parseDirectives } from '@/lib/song/directives'
import { slugify, uniqueSlug } from '@/lib/slug'
import { canonicalTerms } from '@/lib/song/terms'
import { fold, songSearchText, songArtistSort } from '@/lib/text'

export type SongFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

// Linha de música exibida nas listas (acervo/sidebar/picker).
export type SongRow = {
  id: string
  slug: string
  title: string
  artists: string[]
  genres: string[]
  key: string
  comoEstouTocando: number | null
}

// Termos distintos (gêneros/artistas) do acervo do usuário — via unnest, barato
// e limitado (dezenas), sem carregar todas as músicas.
async function facetTerms(userId: string): Promise<{ genres: string[]; artists: string[] }> {
  const [g, a] = await Promise.all([
    prisma.$queryRaw<{ v: string }[]>`
      SELECT DISTINCT unnest(genres) AS v FROM "Song" WHERE "userId" = ${userId} ORDER BY v`,
    prisma.$queryRaw<{ v: string }[]>`
      SELECT DISTINCT unnest(artists) AS v FROM "Song" WHERE "userId" = ${userId} ORDER BY v`,
  ])
  return { genres: g.map((r) => r.v), artists: a.map((r) => r.v) }
}

// Opções de filtro do acervo (dropdowns de gênero/artista).
export async function songFacets(): Promise<{ genres: string[]; artists: string[] }> {
  const { userId } = await verifySession()
  return facetTerms(userId)
}

// Normaliza gêneros/artistas contra o que já existe no acervo do usuário —
// adota a grafia existente (evita "samba" duplicar "Samba").
async function canonical(userId: string, genres: string[], artists: string[]) {
  const facets = await facetTerms(userId)
  return {
    genres: canonicalTerms(genres, facets.genres),
    artists: canonicalTerms(artists, facets.artists),
  }
}

const PAGE_MAX = 60

// Busca paginada do acervo — serve acervo, sidebar e picker. Busca por
// searchText (acento-insensível), filtros opcionais e ordenação.
export async function searchSongs(params: {
  q?: string
  genre?: string
  artist?: string
  sort?: 'titulo' | 'artista' | 'toco'
  excludeRepId?: string
  skip?: number
  take?: number
}): Promise<SongRow[]> {
  const { userId } = await verifySession()
  const q = fold(params.q ?? '')
  const take = Math.min(Math.max(1, params.take ?? 40), PAGE_MAX)
  const skip = Math.max(0, params.skip ?? 0)

  const orderBy: Prisma.SongOrderByWithRelationInput[] =
    params.sort === 'artista'
      ? [{ artistSort: 'asc' }, { title: 'asc' }]
      : params.sort === 'toco'
        ? [{ comoEstouTocando: { sort: 'desc', nulls: 'last' } }, { title: 'asc' }]
        : [{ title: 'asc' }]

  return prisma.song.findMany({
    where: {
      userId,
      ...(q ? { searchText: { contains: q } } : {}),
      ...(params.genre ? { genres: { has: params.genre } } : {}),
      ...(params.artist ? { artists: { has: params.artist } } : {}),
      ...(params.excludeRepId ? { repertoires: { none: { repertoireId: params.excludeRepId } } } : {}),
    },
    orderBy,
    skip,
    take,
    select: {
      id: true,
      slug: true,
      title: true,
      artists: true,
      genres: true,
      key: true,
      comoEstouTocando: true,
    },
  })
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
    data: {
      ...parsed.data,
      ...terms,
      searchText: songSearchText(parsed.data.title, terms.artists),
      artistSort: songArtistSort(terms.artists),
      chordContent,
      userId,
      slug,
    },
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
  const terms = await canonical(userId, parsed.data.genres, parsed.data.artists)
  const { count } = await prisma.song.updateMany({
    where: { id, userId },
    data: {
      ...parsed.data,
      ...terms,
      searchText: songSearchText(parsed.data.title, terms.artists),
      artistSort: songArtistSort(terms.artists),
      chordContent,
    },
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
