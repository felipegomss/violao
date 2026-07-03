'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { chordPositions, looksLikeChord } from '@/lib/chords/diagram'
import { ChordDiagram } from './chord-diagram'

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

// Grade de diagramas dos acordes da música, no fim da cifra (quebra linha, sem
// scroll). Acorde com mais de uma digitação é clicável → popup pra "variar".
// A escolha vale por nome (todos os X da cifra), via voicings/onVary no pai.
export function ChordGrid({
  chords,
  voicings,
  onVary,
}: {
  chords: string[]
  voicings: Record<string, number>
  onVary: (name: string, index: number) => void
}) {
  const [modal, setModal] = useState<string | null>(null)

  // mostra acordes com digitação e também os que "parecem acorde" mas ainda não
  // temos (placeholder "sem digitação"); ignora tokens que nem são acorde (N.C.…)
  const known = chords
    .map((name) => ({ name, positions: chordPositions(name) }))
    .filter((c) => c.positions.length > 0 || looksLikeChord(c.name))

  if (known.length === 0) return null

  const modalPositions = modal ? chordPositions(modal) : []
  const modalSel = modal ? Math.min(voicings[modal] ?? 0, modalPositions.length - 1) : 0

  return (
    <section className="mt-12 border-t border-dotted border-ink/15 pt-6">
      <div className="mb-5 font-cifra text-[11px] lowercase text-faint">acordes</div>

      <div className="flex flex-wrap gap-x-5 gap-y-5">
        {known.map(({ name, positions }) => {
          // sem digitação: braço vazio + aviso (você me manda pra adicionar)
          if (positions.length === 0) {
            return (
              <div key={name} className="relative flex flex-col items-center p-1">
                <ChordDiagram name={name} placeholder />
                <span className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 text-center font-cifra text-[10px] lowercase leading-tight text-faint">
                  sem
                  <br />
                  digitação
                </span>
              </div>
            )
          }
          const sel = Math.min(voicings[name] ?? 0, positions.length - 1)
          const many = positions.length > 1
          const body = (
            <>
              <ChordDiagram name={name} shape={positions[sel]} />
              {many && (
                <span className="mt-1 flex justify-center gap-1" aria-hidden>
                  {positions.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i === sel ? 'bg-teal' : 'bg-ink/20'}`}
                    />
                  ))}
                </span>
              )}
            </>
          )
          return many ? (
            <button
              key={name}
              type="button"
              onClick={() => setModal(name)}
              title="variar acorde"
              className={`flex flex-col items-center rounded-lg p-1 transition-colors duration-150 hover:bg-folha ${FOCUS}`}
            >
              {body}
            </button>
          ) : (
            <div key={name} className="flex flex-col items-center p-1">
              {body}
            </div>
          )
        })}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,19,15,.4)] p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-[520px] rounded-2xl border border-ink/15 bg-folha p-6 shadow-[0_30px_60px_-28px_rgba(38,33,27,.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-editorial text-[22px] font-semibold text-ink">
                digitações de {modal}
              </h3>
              <button
                type="button"
                aria-label="fechar"
                onClick={() => setModal(null)}
                className={`flex h-9 w-9 items-center justify-center text-faint transition-colors duration-150 hover:text-ink ${FOCUS}`}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-wrap gap-4">
              {modalPositions.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={i === modalSel}
                  onClick={() => {
                    onVary(modal, i)
                    setModal(null)
                  }}
                  className={`rounded-lg border p-1 transition-colors duration-150 ${
                    i === modalSel ? 'border-teal bg-teal/5' : 'border-transparent hover:border-ink/20'
                  } ${FOCUS}`}
                >
                  <ChordDiagram name={modal} shape={p} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
