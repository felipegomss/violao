import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { deleteSong } from '@/app/actions/songs'
import { parseChordSheet, type ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { AppSidebar } from '@/components/app-sidebar'
import { DeleteSongButton } from './delete-song-button'
import { EditorialCifra } from './editorial-cifra'

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

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header band */}
        <div className="flex items-start justify-between gap-6 border-b border-ink/12 bg-folha px-8 py-6">
          <div className="min-w-0">
            <div className="mb-1.5 font-cifra text-[10px] uppercase tracking-[.2em] text-faint">
              acervo → {song.title}
            </div>
            <h1 className="font-editorial text-[40px] font-medium leading-none">{song.title}</h1>
            <div className="mt-1 font-editorial text-[19px] italic text-soft">
              {song.artist}
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
            <Link
              href={`/songs/${song.id}/edit`}
              className="rounded border border-ink/22 px-3 py-2 font-cifra text-[11px] uppercase tracking-wide text-soft hover:text-ink"
            >
              editar
            </Link>
            <DeleteSongButton action={deleteThis} />
            <button
              type="button"
              disabled
              title="em breve"
              className="flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 font-cifra text-[11px] uppercase tracking-wide text-folha disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-block h-[9px] w-[9px] rounded-[2px] border-[1.5px] border-folha" />
              modo palco
            </button>
          </div>
        </div>

        {/* Content split */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_320px] lg:min-h-0">
          {/* Cifra sheet */}
          <div className="overflow-y-auto px-8 py-8 lg:px-10">
            {song.chordFormat === 'TRADICIONAL' ? (
              sheet ? (
                <EditorialCifra sheet={sheet} />
              ) : (
                <>
                  {parseFailed && (
                    <p className="mb-2 text-sm text-soft">
                      não foi possível formatar; exibindo texto cru
                    </p>
                  )}
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-ink/15 bg-folha p-4 font-cifra text-[13px] text-ink">
                    {song.chordContent || '(vazio)'}
                  </pre>
                </>
              )
            ) : (
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-ink/15 bg-folha p-4 font-cifra text-[13px] text-ink">
                {song.chordContent || '(vazio)'}
              </pre>
            )}

            {song.notes && (
              <div className="mt-9 max-w-[640px] rounded-r-md border-l-[3px] border-rust bg-[#efe7d5] px-5 py-4">
                <div className="mb-2 font-cifra text-[10px] uppercase tracking-[.2em] text-faint">
                  Anotações do professor
                </div>
                <p className="font-editorial text-[17px] italic leading-relaxed text-[#3a342c]">
                  {song.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right rail */}
          <div className="flex flex-col border-t border-ink/12 bg-[#efe7d5] lg:border-l lg:border-t-0">
            {/* Player · referência */}
            <div className="border-b border-ink/12 p-[18px]">
              <div className="mb-2.5 font-cifra text-[9px] uppercase tracking-[.2em] text-faint">
                Player · referência
              </div>
              <div
                className="relative flex aspect-video items-center justify-center rounded-md border border-ink/15"
                style={{
                  background:
                    'repeating-linear-gradient(135deg,#ddd2bd,#ddd2bd 9px,#d5c9b2 9px,#d5c9b2 18px)',
                }}
              >
                <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-ink/[.82]">
                  <span className="ml-[3px] h-0 w-0 border-y-[8px] border-l-[12px] border-y-transparent border-l-folha" />
                </div>
                {song.referenceYoutubeUrl ? (
                  <span className="absolute bottom-1.5 left-2 font-cifra text-[8px] tracking-wide text-teal">
                    referência ↗
                  </span>
                ) : (
                  <span className="absolute bottom-1.5 left-2 font-cifra text-[8px] tracking-wide text-soft">
                    vídeo do artista
                  </span>
                )}
              </div>

              {/* A-B scrub */}
              <div className="relative mt-3 h-1.5 rounded bg-ink/[.14]">
                <div className="absolute inset-y-0 left-[28%] right-[38%] rounded bg-teal/[.32]" />
                <div className="absolute left-[28%] -top-1 h-3.5 w-0.5 bg-teal" />
                <div className="absolute left-[62%] -top-1 h-3.5 w-0.5 bg-teal" />
                <div className="absolute left-[44%] -top-[3px] h-3 w-3 rounded-full bg-ink" />
              </div>
              <div className="mt-2 flex justify-between font-cifra text-[10px] text-soft">
                <span className="font-medium text-teal">◱ A–B loop</span>
                <span>0:00 / —</span>
              </div>
            </div>

            {/* Acompanhamento */}
            <div className="flex flex-col gap-4 border-b border-ink/12 p-[18px]">
              <div className="font-cifra text-[9px] uppercase tracking-[.2em] text-faint">
                Acompanhamento
              </div>

              {/* Formato */}
              <div>
                <div className="mb-1.5 font-cifra text-[9px] tracking-[.06em] text-faint">FORMATO</div>
                <div className="flex overflow-hidden rounded-md border border-ink/22">
                  <button
                    type="button"
                    disabled
                    className={`flex-1 py-2 font-cifra text-[11px] tracking-[.04em] ${
                      song.chordFormat === 'TRADICIONAL' ? 'bg-teal font-medium text-folha' : 'text-soft'
                    }`}
                  >
                    Tradicional
                  </button>
                  <button
                    type="button"
                    disabled
                    className={`flex-1 py-2 font-cifra text-[11px] tracking-[.04em] ${
                      song.chordFormat === 'GRADE' ? 'bg-teal font-medium text-folha' : 'text-soft'
                    }`}
                  >
                    Grade
                  </button>
                </div>
              </div>

              {/* Notação */}
              <div>
                <div className="mb-1.5 font-cifra text-[9px] tracking-[.06em] text-faint">NOTAÇÃO</div>
                <div className="flex overflow-hidden rounded-md border border-ink/22">
                  <button
                    type="button"
                    disabled
                    className="flex-1 bg-teal py-2 font-cifra text-[11px] font-medium tracking-[.04em] text-folha"
                  >
                    Acorde
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-2 font-cifra text-[11px] tracking-[.04em] text-soft"
                  >
                    Grau
                  </button>
                </div>
              </div>

              {/* Transpor */}
              <div>
                <div className="mb-1.5 font-cifra text-[9px] tracking-[.06em] text-faint">TRANSPOR</div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled
                    className="h-[34px] w-[34px] rounded-md border border-ink/22 bg-folha font-cifra text-base text-ink"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-cifra text-sm font-medium text-teal">
                    0 · {song.key}
                  </span>
                  <button
                    type="button"
                    disabled
                    className="h-[34px] w-[34px] rounded-md border border-ink/22 bg-folha font-cifra text-base text-ink"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Auto-scroll */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-cifra text-[9px] tracking-[.06em] text-faint">AUTO-SCROLL</span>
                  <span className="rounded border border-ink/22 px-2 py-0.5 font-cifra text-[9px] uppercase tracking-[.1em] text-soft">
                    off
                  </span>
                </div>
                <input type="range" min={1} max={5} step={1} defaultValue={2} disabled className="w-full" />
                <div className="mt-0.5 flex justify-between font-cifra text-[8px] text-faint">
                  <span>lento</span>
                  <span>veloc. 2</span>
                  <span>rápido</span>
                </div>
              </div>

              {/* Metrônomo */}
              <div className="flex items-center justify-between">
                <span className="font-cifra text-[9px] tracking-[.06em] text-faint">METRÔNOMO</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-[3px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-rust" />
                    <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
                  </div>
                  <span className="font-cifra text-[13px] font-medium text-ink">
                    {song.bpm ?? '—'} <span className="text-[9px] text-faint">bpm</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Como estou tocando */}
            <div className="p-[18px]">
              <div className="mb-2.5 font-cifra text-[9px] uppercase tracking-[.2em] text-faint">
                Como estou tocando
              </div>
              <div className="mb-2 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="h-3 w-[26px] rounded-sm bg-ink/[.16]" />
                ))}
              </div>
              <div className="font-editorial text-[15px] italic text-soft">ainda não avaliado</div>
            </div>
          </div>
        </div>
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
