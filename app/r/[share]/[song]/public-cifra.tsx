'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, Minus, Plus } from 'lucide-react'
import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { transposeChord, degreeChord } from '@/lib/chords/transform'
import { chordDiagram, type ChordShape } from '@/lib/chords/diagram'
import { CompassoWordmark } from '@/components/compasso-wordmark'
import { EditorialCifra } from '@/app/songs/[slug]/editorial-cifra'
import { ChordDiagram } from '@/app/songs/[slug]/chord-diagram'
import { ChordGrid } from '@/app/songs/[slug]/chord-grid'

type Notation = 'chord' | 'degree'

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

// Espelho do <Btn variant="primary" size="md"> pra usar em <Link> (Btn é <button>).
const BTN_PRIMARY_LINK =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-transparent bg-teal px-5 font-cifra text-[13px] lowercase tracking-[.02em] text-folha transition-colors duration-150 hover:bg-[#16323f] focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

// Folha pública, read-only. Sem rating/scroll/metrônomo/palco/edição — só as
// ferramentas de leitura (notação + transpor) e o convite pra forkar a música.
export function PublicCifra({
  share,
  songId,
  title,
  artists,
  capo,
  tuning,
  songKey,
  sheet,
  parseFailed,
  rawContent,
}: {
  share: string
  songId: string
  title: string
  artists: string[]
  capo: number | null
  tuning: string
  songKey: string
  sheet: ChordSheetModel | null
  parseFailed: boolean
  rawContent: string
}) {
  const [notation, setNotation] = useState<Notation>('chord')
  const [transpose, setTranspose] = useState(0)
  const [voicings, setVoicings] = useState<Record<string, number>>({})
  const [hover, setHover] = useState<
    { name: string; shape: ChordShape; top: number; left: number } | null
  >(null)

  // Hover num acorde → posiciona o diagrama perto dele (lookup client-side).
  const onChordHover = (chord: string, el: HTMLElement | null) => {
    if (!chord || !el) {
      setHover(null)
      return
    }
    const shape = chordDiagram(chord, voicings[chord] ?? 0)
    if (!shape) {
      setHover(null)
      return
    }
    const r = el.getBoundingClientRect()
    const TIP_W = 130
    const TIP_H = 168
    const left = Math.max(8, Math.min(r.left, window.innerWidth - TIP_W - 8))
    const top =
      r.bottom + 6 + TIP_H > window.innerHeight ? r.top - TIP_H - 6 : r.bottom + 6
    setHover({ name: chord, shape, top, left })
  }

  const shownSheet: ChordSheetModel | null = useMemo(() => {
    if (!sheet) return null
    const displayChord = (chord: string) =>
      notation === 'degree' ? degreeChord(chord, songKey) : transposeChord(chord, transpose)
    return {
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
  }, [sheet, notation, transpose, songKey])

  const uniqueChords = useMemo(() => {
    if (!shownSheet) return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const line of shownSheet.lines) {
      if (line.type !== 'row') continue
      for (const it of line.items) {
        if (it.chord && !seen.has(it.chord)) {
          seen.add(it.chord)
          out.push(it.chord)
        }
      }
    }
    return out
  }, [shownSheet])

  const shownKey = transposeChord(songKey, transpose)

  const metaParts: string[] = []
  metaParts.push(
    notation === 'chord' && transpose !== 0
      ? `tom ${songKey} → ${shownKey}`
      : `tom ${songKey}`,
  )
  if (capo != null && capo > 0) metaParts.push(`capo ${capo}ª`)
  metaParts.push(tuning)

  const rawPre = (
    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-ink/15 bg-folha p-4 font-cifra text-[13px] text-ink">
      {rawContent || '(vazio)'}
    </pre>
  )

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10">
        <Link href={`/r/${share}`} aria-label="Voltar ao repertório" className="text-ink">
          <CompassoWordmark size={22} />
        </Link>

        <header className="mt-8 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-editorial text-[32px] font-semibold leading-none">{title}</h1>
            <div className="mt-2 font-editorial text-[19px] italic text-teal">
              {artists.join(', ')}
            </div>
            <div className="mt-3 font-cifra text-[13px] text-soft">
              {metaParts.join(' · ')}
            </div>
          </div>
          <div className="flex flex-none flex-col items-end gap-1.5">
            <Link href={`/songs/new?from=${songId}`} className={BTN_PRIMARY_LINK}>
              <BookmarkPlus size={16} strokeWidth={2} /> Adicionar ao meu acervo
            </Link>
            <span className="font-cifra text-[11px] lowercase text-faint">
              salva uma cópia no seu Compasso
            </span>
          </div>
        </header>

        {/* barra leve: notação + transpor (só quando a cifra parseou) */}
        {shownSheet && (
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-dotted border-ink/15 py-3">
            <div className="flex items-center gap-2">
              <span className="font-cifra text-[11px] lowercase text-faint">notação</span>
              <div className="flex gap-1">
                {(['chord', 'degree'] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNotation(n)}
                    className={`flex h-11 items-center px-1 font-cifra text-[12px] lowercase transition-colors duration-150 ${FOCUS} ${
                      notation === n ? 'text-teal underline underline-offset-4' : 'text-soft hover:text-ink'
                    }`}
                  >
                    {n === 'chord' ? 'acorde' : 'grau'}
                  </button>
                ))}
              </div>
            </div>

            {notation === 'chord' && (
              <div className="flex items-center gap-2">
                <span className="font-cifra text-[11px] lowercase text-faint">transpor</span>
                <button
                  type="button"
                  onClick={() => setTranspose((t) => t - 1)}
                  aria-label="descer meio tom"
                  className={`flex h-11 w-11 items-center justify-center rounded-lg text-soft transition-colors duration-150 hover:text-ink ${FOCUS}`}
                >
                  <Minus size={16} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setTranspose((t) => t + 1)}
                  aria-label="subir meio tom"
                  className={`flex h-11 w-11 items-center justify-center rounded-lg text-soft transition-colors duration-150 hover:text-ink ${FOCUS}`}
                >
                  <Plus size={16} strokeWidth={2} />
                </button>
                {transpose !== 0 && (
                  <button
                    type="button"
                    onClick={() => setTranspose(0)}
                    className={`flex h-11 items-center px-1 font-cifra text-[11px] lowercase text-teal underline underline-offset-4 transition-colors duration-150 hover:text-ink ${FOCUS}`}
                  >
                    restaurar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          {shownSheet ? (
            <EditorialCifra
              sheet={shownSheet}
              onChordHover={notation === 'chord' ? onChordHover : undefined}
            />
          ) : (
            <>
              {parseFailed && (
                <p className="mb-2 text-sm text-soft">
                  não deu pra formatar. Tá aí o texto cru mesmo.
                </p>
              )}
              {rawPre}
            </>
          )}
        </div>

        {uniqueChords.length > 0 && (
          <ChordGrid
            chords={uniqueChords}
            voicings={voicings}
            onVary={(name, index) => setVoicings((v) => ({ ...v, [name]: index }))}
          />
        )}
      </div>

      {hover && (
        <div
          className="pointer-events-none fixed z-40 rounded-xl border border-ink/20 bg-folha px-3 py-2.5 shadow-[0_18px_40px_-18px_rgba(38,33,27,.55)]"
          style={{ top: hover.top, left: hover.left }}
        >
          <ChordDiagram name={hover.name} shape={hover.shape} />
        </div>
      )}
    </div>
  )
}
