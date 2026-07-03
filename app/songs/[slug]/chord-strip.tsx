'use client'

import { useState } from 'react'
import { chordPositions } from '@/lib/chords/diagram'
import { ChordDiagram } from './chord-diagram'

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

// Linha de diagramas dos acordes (pin chords), na ordem de aparição. Cada
// acorde com mais de uma digitação ganha "variar acorde" (estilo CifraClub):
// bolinhas de posição + um painel pra escolher. A escolha vale por nome de
// acorde (todos os F#7 da cifra), via `voicings`/`onVary` no pai.
export function ChordStrip({
  chords,
  voicings,
  onVary,
}: {
  chords: string[]
  voicings: Record<string, number>
  onVary: (name: string, index: number) => void
}) {
  const [openChord, setOpenChord] = useState<string | null>(null)

  const known = chords
    .map((name) => ({ name, positions: chordPositions(name) }))
    .filter((c) => c.positions.length > 0)

  if (known.length === 0) return null

  return (
    <div role="list" aria-label="acordes da música" className="flex gap-4 overflow-x-auto pb-2">
      {known.map(({ name, positions }) => {
        const sel = Math.min(voicings[name] ?? 0, positions.length - 1)
        const many = positions.length > 1
        const open = openChord === name
        return (
          <div key={name} role="listitem" className="relative flex-none">
            <ChordDiagram name={name} shape={positions[sel]} compact />

            {many && (
              <div className="mt-1 flex flex-col items-center gap-1">
                <div className="flex gap-1" aria-hidden>
                  {positions.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i === sel ? 'bg-teal' : 'bg-ink/20'}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenChord(open ? null : name)}
                  aria-expanded={open}
                  className={`font-cifra text-[11px] lowercase text-teal transition-colors duration-150 hover:text-ink ${FOCUS}`}
                >
                  variar acorde
                </button>
              </div>
            )}

            {open && (
              <>
                <button
                  type="button"
                  aria-label="fechar"
                  onClick={() => setOpenChord(null)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 rounded-xl border border-ink/15 bg-folha p-3 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
                  <div className="mb-2 px-1 font-cifra text-[11px] lowercase text-faint">
                    digitações de {name}
                  </div>
                  <div className="flex max-w-[78vw] gap-2 overflow-x-auto">
                    {positions.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={i === sel}
                        onClick={() => {
                          onVary(name, i)
                          setOpenChord(null)
                        }}
                        className={`flex-none rounded-lg border p-1 transition-colors duration-150 ${
                          i === sel ? 'border-teal bg-teal/5' : 'border-transparent hover:border-ink/20'
                        } ${FOCUS}`}
                      >
                        <ChordDiagram name={name} shape={p} compact />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
