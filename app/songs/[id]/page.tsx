import Link from 'next/link'
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
}: {
  params: Promise<{ id: string }>
}) {
  await verifySession()
  const { id } = await params
  const song = await prisma.song.findUnique({ where: { id } })
  if (!song) notFound()

  const deleteThis = deleteSong.bind(null, song.id)

  const afinacao = song.tuning === 'standard' ? 'E A D G B E' : song.tuning

  let sheet: ChordSheetModel | null = null
  let parseFailed = false
  if (song.chordFormat === 'TRADICIONAL') {
    try {
      sheet = parseChordSheet(song.chordContent)
    } catch {
      parseFailed = true
    }
  }

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AppSidebar active="acervo" />

      {/* Main column (full-width; conteúdo capado em max-w-7xl) */}
      <div className="flex w-full min-w-0 flex-col">
        {/* Header band — faixa folha ocupa tudo, conteúdo centralizado */}
        <div className="border-b border-ink/12 bg-folha">
          <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-6 px-8 py-6">
          <div className="min-w-0">
            <div className="mb-1.5 font-cifra text-[10px] uppercase tracking-[.2em] text-faint">
              acervo → {song.title}
            </div>
            <h1 className="font-editorial text-[40px] font-medium leading-none">{song.title}</h1>
            <div className="mt-1 font-editorial text-[19px] italic text-soft">
              {song.artists.join(', ')}
              {song.genres.length > 0 ? ` · ${song.genres.join(', ')}` : ''}
            </div>

            {/* Meta chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <MetaChip label="tom" value={song.key} filled />
              <MetaChip label="capotraste" value={song.capo != null ? `casa ${song.capo}` : 'sem capo'} />
              <MetaChip label="afinação" value={afinacao} />
              {song.version && <MetaChip label="versão" value={song.version} />}
            </div>
          </div>

          <div className="flex flex-none items-center gap-3">
            <StagePalco sheet={sheet} title={song.title} songKey={song.key} bpm={song.bpm} />
            <SongActions songId={song.id} deleteAction={deleteThis} />
          </div>
          </div>
        </div>

        {/* Content split (interativo: notação + transpor) */}
        <CifraStudy
          songId={song.id}
          sheet={sheet}
          parseFailed={parseFailed}
          rawContent={song.chordContent}
          chordFormat={song.chordFormat}
          songKey={song.key}
          bpm={song.bpm}
          referenceYoutubeUrl={song.referenceYoutubeUrl}
          notes={song.notes}
          comoEstouTocando={song.comoEstouTocando}
        />
      </div>
    </div>
  )
}

function MetaChip({
  label,
  value,
  filled = false,
}: {
  label: string
  value: string
  filled?: boolean
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="font-cifra text-[8px] uppercase tracking-[.14em] text-faint">{label}</span>
      {filled ? (
        <span className="rounded bg-teal px-2.5 py-1 font-cifra text-[13px] font-medium text-folha">
          {value}
        </span>
      ) : (
        <span className="rounded border border-ink/22 px-2.5 py-1 font-cifra text-[13px] text-ink">
          {value}
        </span>
      )}
    </div>
  )
}
