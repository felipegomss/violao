import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { deleteSong } from '@/app/actions/songs'
import { parseChordSheet, type ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { AppSidebar } from '@/components/app-sidebar'
import { SongActions } from './song-actions'
import { StagePalco } from './stage-palco'
import { CifraStudy } from './cifra-study'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { userId } = await verifySession()
  const { slug } = await params
  const song = await prisma.song.findFirst({
    where: { slug, userId },
    select: { title: true, artists: true },
  })
  if (!song) return {}
  const artist = song.artists[0]
  return { title: artist ? `${song.title} — ${artist}` : song.title }
}

export default async function SongDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ palco?: string; rep?: string }>
}) {
  const { userId } = await verifySession()
  const { slug } = await params
  const { palco, rep } = await searchParams
  const song = await prisma.song.findFirst({ where: { slug, userId } })
  if (!song) notFound()

  const deleteThis = deleteSong.bind(null, song.id)

  // Vindo de um repertório: passa a lista ordenada pro palco navegar como playlist.
  // rep é o slug do repertório; a playlist carrega o slug de cada música.
  let playlist: { slug: string; title: string }[] = []
  if (rep) {
    const repertoire = await prisma.repertoire.findFirst({
      where: { slug: rep, userId },
      include: {
        songs: {
          orderBy: { order: 'asc' },
          include: { song: { select: { slug: true, title: true } } },
        },
      },
    })
    if (repertoire)
      playlist = repertoire.songs.map((s) => ({ slug: s.song.slug, title: s.song.title }))
  }

  const afinacao = song.tuning === 'standard' ? 'E A D G B E' : song.tuning

  let sheet: ChordSheetModel | null = null
  let parseFailed = false
  try {
    sheet = parseChordSheet(song.chordContent)
  } catch {
    parseFailed = true
  }

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AppSidebar active="acervo" />

      {/* A folha é client (CifraStudy renderiza o header: o "tom" é metadado
          vivo, reflete a transposição). O server só injeta as ações. */}
      <div className="flex w-full min-w-0 flex-col">
        <CifraStudy
          songId={song.id}
          title={song.title}
          artists={song.artists}
          genres={song.genres}
          capo={song.capo}
          tuning={afinacao}
          version={song.version}
          sheet={sheet}
          parseFailed={parseFailed}
          rawContent={song.chordContent}
          songKey={song.key}
          bpm={song.bpm}
          referenceYoutubeUrl={song.referenceYoutubeUrl}
          notes={song.notes}
          comoEstouTocando={song.comoEstouTocando}
          initialVoicings={(song.voicings as Record<string, number> | null) ?? undefined}
          actions={
            <>
              <StagePalco
                key={song.id}
                sheet={sheet}
                title={song.title}
                songKey={song.key}
                bpm={song.bpm}
                currentSlug={song.slug}
                playlist={playlist}
                repertoireSlug={rep}
                autoOpen={palco === '1'}
              />
              <SongActions slug={song.slug} deleteAction={deleteThis} />
            </>
          }
        />
      </div>
    </div>
  )
}
