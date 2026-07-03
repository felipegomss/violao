import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseChordSheet, type ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { PublicCifra } from './public-cifra'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ share: string; song: string }>
}): Promise<Metadata> {
  const { share, song: songSlug } = await params
  const rep = await prisma.repertoire.findFirst({
    where: { shareSlug: share },
    select: { songs: { select: { song: { select: { slug: true, title: true, artists: true } } } } },
  })
  const song = rep?.songs.find((s) => s.song.slug === songSlug)?.song
  if (!song) return {}
  const artist = song.artists[0]
  return { title: artist ? `${song.title} — ${artist}` : song.title }
}

// Rota PÚBLICA — sem verifySession, sem userId. A cifra só é visível se a música
// estiver DENTRO de um repertório público (validação de posse via shareSlug).
export default async function PublicSongPage({
  params,
}: {
  params: Promise<{ share: string; song: string }>
}) {
  const { share, song: songSlug } = await params
  const rep = await prisma.repertoire.findFirst({
    where: { shareSlug: share },
    include: { songs: { include: { song: true }, take: 500 } },
  })
  if (!rep) notFound()

  const rs = rep.songs.find((s) => s.song.slug === songSlug)
  if (!rs) notFound()
  const song = rs.song

  const afinacao = song.tuning === 'standard' ? 'E A D G B E' : song.tuning

  let sheet: ChordSheetModel | null = null
  let parseFailed = false
  try {
    sheet = parseChordSheet(song.chordContent)
  } catch {
    parseFailed = true
  }

  return (
    <PublicCifra
      share={share}
      songId={song.id}
      title={song.title}
      artists={song.artists}
      capo={song.capo}
      tuning={afinacao}
      songKey={song.key}
      sheet={sheet}
      parseFailed={parseFailed}
      rawContent={song.chordContent}
      initialVoicings={(song.voicings as Record<string, number> | null) ?? undefined}
    />
  )
}
