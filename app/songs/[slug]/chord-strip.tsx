'use client'

import { chordDiagram, type ChordShape } from '@/lib/chords/diagram'
import { ChordDiagram } from './chord-diagram'

// Linha de diagramas dos acordes da música (pin chords), na ordem de aparição.
// Recebe tokens já transpostos; acorde sem shape conhecido simplesmente não entra.
export function ChordStrip({ chords }: { chords: string[] }) {
  const known = chords
    .map((name) => ({ name, shape: chordDiagram(name) }))
    .filter((c): c is { name: string; shape: ChordShape } => c.shape !== null)

  if (known.length === 0) return null

  return (
    <div
      role="list"
      aria-label="acordes da música"
      className="flex gap-4 overflow-x-auto pb-2"
    >
      {known.map((c) => (
        <div key={c.name} role="listitem" className="flex-none">
          <ChordDiagram name={c.name} shape={c.shape} compact />
        </div>
      ))}
    </div>
  )
}
