import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { deleteSong } from '@/app/actions/songs'
import { parseChordSheet, type ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { AppSidebar } from '@/components/app-sidebar'
import { SongActions } from './song-actions'
import { StagePalco } from './stage-palco'
import { CifraStudy } from './cifra-study'

export default async function SongDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ palco?: string; rep?: string }>
}) {
  const { userId } = await verifySession()
  const { id } = await params
  const { palco, rep } = await searchParams
  const song = await prisma.song.findFirst({ where: { id, userId } })
  if (!song) notFound()

  const deleteThis = deleteSong.bind(null, song.id)

  // Vindo de um repertório: passa a lista ordenada pro palco navegar como playlist.
  let playlist: { id: string; title: string }[] = []
  if (rep) {
    const repertoire = await prisma.repertoire.findFirst({
      where: { id: rep, userId },
      include: {
        songs: {
          orderBy: { order: 'asc' },
          include: { song: { select: { id: true, title: true } } },
        },
      },
    })
    if (repertoire) playlist = repertoire.songs.map((s) => ({ id: s.song.id, title: s.song.title }))
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
          actions={
            <>
              <StagePalco
                key={song.id}
                sheet={sheet}
                title={song.title}
                songKey={song.key}
                bpm={song.bpm}
                currentId={song.id}
                playlist={playlist}
                repertoireId={rep}
                autoOpen={palco === '1'}
              />
              <SongActions songId={song.id} deleteAction={deleteThis} />
            </>
          }
        />
      </div>
    </div>
  )
}
