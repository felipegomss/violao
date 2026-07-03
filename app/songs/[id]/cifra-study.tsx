'use client'

import { useState } from 'react'
import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { transposeChord, degreeChord } from '@/lib/chords/transform'
import { EditorialCifra } from './editorial-cifra'

type Notation = 'chord' | 'degree'

export function CifraStudy({
  sheet,
  parseFailed,
  rawContent,
  chordFormat,
  songKey,
  bpm,
  referenceYoutubeUrl,
  notes,
}: {
  sheet: ChordSheetModel | null
  parseFailed: boolean
  rawContent: string
  chordFormat: 'TRADICIONAL' | 'GRADE'
  songKey: string
  bpm: number | null
  referenceYoutubeUrl: string | null
  notes: string | null
}) {
  const [notation, setNotation] = useState<Notation>('chord')
  const [transpose, setTranspose] = useState(0)

  const displayChord = (chord: string) =>
    notation === 'degree' ? degreeChord(chord, songKey) : transposeChord(chord, transpose)

  const shownSheet: ChordSheetModel | null = sheet && {
    lines: sheet.lines.map((line) =>
      line.type === 'row'
        ? {
            type: 'row' as const,
            items: line.items.map((it) => ({
              chord: it.chord ? displayChord(it.chord) : it.chord,
              lyrics: it.lyrics,
            })),
          }
        : line,
    ),
  }

  const transposeLabel =
    notation === 'degree'
      ? 'graus'
      : `${transpose > 0 ? '+' : ''}${transpose} · ${transposeChord(songKey, transpose)}`

  const rawPre = (
    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-ink/15 bg-folha p-4 font-cifra text-[13px] text-ink">
      {rawContent || '(vazio)'}
    </pre>
  )

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_320px] lg:min-h-0">
      {/* Cifra sheet */}
      <div className="overflow-y-auto px-8 py-8 lg:px-10">
        {chordFormat === 'TRADICIONAL' ? (
          shownSheet ? (
            <EditorialCifra sheet={shownSheet} />
          ) : (
            <>
              {parseFailed && (
                <p className="mb-2 text-sm text-soft">
                  não foi possível formatar; exibindo texto cru
                </p>
              )}
              {rawPre}
            </>
          )
        ) : (
          rawPre
        )}

        {notes && (
          <div className="mt-9 max-w-[640px] rounded-r-md border-l-[3px] border-rust bg-[#efe7d5] px-5 py-4">
            <div className="mb-2 font-cifra text-[10px] uppercase tracking-[.2em] text-faint">
              Anotações do professor
            </div>
            <p className="font-editorial text-[17px] italic leading-relaxed text-[#3a342c]">
              {notes}
            </p>
          </div>
        )}
      </div>

      {/* Right rail */}
      <div className="flex flex-col border-t border-ink/12 bg-[#efe7d5] lg:border-l lg:border-t-0">
        {/* Player · referência (stub) */}
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
            {referenceYoutubeUrl ? (
              <span className="absolute bottom-1.5 left-2 font-cifra text-[8px] tracking-wide text-teal">
                referência ↗
              </span>
            ) : (
              <span className="absolute bottom-1.5 left-2 font-cifra text-[8px] tracking-wide text-soft">
                vídeo do artista
              </span>
            )}
          </div>
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

          {/* Formato (reflete o formato da música; sem alternância) */}
          <div>
            <div className="mb-1.5 font-cifra text-[9px] tracking-[.06em] text-faint">FORMATO</div>
            <div className="flex overflow-hidden rounded-md border border-ink/22">
              <button
                type="button"
                disabled
                className={`flex-1 py-2 font-cifra text-[11px] tracking-[.04em] ${
                  chordFormat === 'TRADICIONAL' ? 'bg-teal font-medium text-folha' : 'text-soft'
                }`}
              >
                Tradicional
              </button>
              <button
                type="button"
                disabled
                className={`flex-1 py-2 font-cifra text-[11px] tracking-[.04em] ${
                  chordFormat === 'GRADE' ? 'bg-teal font-medium text-folha' : 'text-soft'
                }`}
              >
                Grade
              </button>
            </div>
          </div>

          {/* Notação — FUNCIONAL */}
          <div>
            <div className="mb-1.5 font-cifra text-[9px] tracking-[.06em] text-faint">NOTAÇÃO</div>
            <div className="flex overflow-hidden rounded-md border border-ink/22">
              <button
                type="button"
                onClick={() => setNotation('chord')}
                className={`flex-1 py-2 font-cifra text-[11px] tracking-[.04em] ${
                  notation === 'chord' ? 'bg-teal font-medium text-folha' : 'text-soft'
                }`}
              >
                Acorde
              </button>
              <button
                type="button"
                onClick={() => setNotation('degree')}
                className={`flex-1 py-2 font-cifra text-[11px] tracking-[.04em] ${
                  notation === 'degree' ? 'bg-teal font-medium text-folha' : 'text-soft'
                }`}
              >
                Grau
              </button>
            </div>
          </div>

          {/* Transpor — FUNCIONAL (desabilitado no modo grau) */}
          <div>
            <div className="mb-1.5 font-cifra text-[9px] tracking-[.06em] text-faint">TRANSPOR</div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTranspose((t) => Math.max(-6, t - 1))}
                disabled={notation === 'degree'}
                className="h-[34px] w-[34px] rounded-md border border-ink/22 bg-folha font-cifra text-base text-ink disabled:opacity-40"
              >
                −
              </button>
              <span className="flex-1 text-center font-cifra text-sm font-medium text-teal">
                {transposeLabel}
              </span>
              <button
                type="button"
                onClick={() => setTranspose((t) => Math.min(6, t + 1))}
                disabled={notation === 'degree'}
                className="h-[34px] w-[34px] rounded-md border border-ink/22 bg-folha font-cifra text-base text-ink disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Auto-scroll (stub) */}
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

          {/* Metrônomo (stub) */}
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
                {bpm ?? '—'} <span className="text-[9px] text-faint">bpm</span>
              </span>
            </div>
          </div>
        </div>

        {/* Como estou tocando (stub) */}
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
  )
}
