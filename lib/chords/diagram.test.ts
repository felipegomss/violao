import { describe, expect, it } from 'vitest'
import { chordDiagram } from './diagram'
import { CHORD_OVERRIDES } from './overrides'

describe('chordDiagram', () => {
  it('acha acordes comuns (6 cordas)', () => {
    const g = chordDiagram('G')
    expect(g).not.toBeNull()
    expect(g?.frets).toHaveLength(6)
  })

  it('m7 do C bate com a digitação do chords-db', () => {
    expect(chordDiagram('Cm7')?.frets).toEqual([-1, 3, 1, 3, 4, -1])
  })

  it('mapeia notação BR (m7(5-) → m7b5)', () => {
    expect(chordDiagram('F#m7(5-)')).not.toBeNull()
    expect(chordDiagram('C7M')).not.toBeNull() // 7M → maj7
  })

  it('resolve enarmonia da fundamental (Bb, Ab)', () => {
    expect(chordDiagram('Bbm7')).not.toBeNull()
    expect(chordDiagram('Ab7')).not.toBeNull()
  })

  it('baixo invertido usa a tríade principal', () => {
    expect(chordDiagram('G/B')).toEqual(chordDiagram('G'))
  })

  it('grau ou token inválido → null', () => {
    expect(chordDiagram('VIm7')).toBeNull()
    expect(chordDiagram('N.C.')).toBeNull()
    expect(chordDiagram('%')).toBeNull()
  })

  it('override tem precedência (e vale pra tríade em baixo invertido)', () => {
    const custom = { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1, barres: [] }
    CHORD_OVERRIDES['G'] = custom
    try {
      expect(chordDiagram('G')).toEqual(custom)
      expect(chordDiagram('G/B')).toEqual(custom)
    } finally {
      delete CHORD_OVERRIDES['G']
    }
  })
})
