import { describe, expect, it } from 'vitest'
import { chordDiagram, chordPositions, looksLikeChord, type ChordShape } from './diagram'
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

  it('acorde com baixo (tríade) reflete o baixo: G/B tem B na corda mais grave', () => {
    // grafias: cordas soltas E A D G B e = classes 4 9 2 7 11 4; B = 11
    const OPEN = [4, 9, 2, 7, 11, 4]
    const noteAt = (p: ChordShape, i: number) =>
      (OPEN[i] + (p.baseFret > 1 ? p.baseFret - 1 + p.frets[i] : p.frets[i])) % 12
    const g = chordDiagram('G')!
    const gb = chordDiagram('G/B')!
    expect(gb).not.toEqual(g) // não é mais a tríade crua
    expect(gb.bassString).not.toBeUndefined()
    expect(noteAt(gb, gb.bassString!)).toBe(11) // baixo = B
  })

  it('acorde com baixo sem entrada no db não gera nada, mas parece acorde (E7/G#)', () => {
    // sem geração automática: mostramos "sem digitação" e o usuário manda o shape
    expect(chordPositions('E7/G#')).toEqual([])
    expect(looksLikeChord('E7/G#')).toBe(true)
  })

  it('looksLikeChord separa acorde de token não-acorde', () => {
    expect(looksLikeChord('N.C.')).toBe(false)
    expect(looksLikeChord('%')).toBe(false)
    expect(looksLikeChord('Bm7')).toBe(true)
  })

  it("não confunde barra de baixo com '/' interno: A7M(6/11+) não vira acorde com baixo", () => {
    // termina em '+)', não em /Nota → tratado como token único (sem digitação no db → vazio)
    expect(chordPositions('A7M(6/11+)')).toEqual([])
  })

  it('grau ou token inválido → null', () => {
    expect(chordDiagram('VIm7')).toBeNull()
    expect(chordDiagram('N.C.')).toBeNull()
    expect(chordDiagram('%')).toBeNull()
  })

  it('expõe múltiplas digitações e indexa por posição', () => {
    const pos = chordPositions('C')
    expect(pos.length).toBeGreaterThan(1)
    expect(chordDiagram('C', 1)).toEqual(pos[1])
    // índice fora do range cai na primeira (graceful)
    expect(chordDiagram('C', 99)).toEqual(pos[0])
  })

  it('E7/B vem do override embutido (x20100, baixo na 5ª corda)', () => {
    const p = chordDiagram('E7/B')!
    expect(p.frets).toEqual([-1, 2, 0, 1, 0, 0])
    expect(p.bassString).toBe(1)
  })

  it('override por token exato tem precedência (acorde-com-baixo que o db não tem)', () => {
    expect(chordPositions('D7/A')).toEqual([]) // sem override, e o db não tem 7/A → vazio
    const custom: ChordShape = {
      frets: [-1, -1, -1, 1, 0, 0], fingers: [0, 0, 0, 1, 0, 0], baseFret: 1, barres: [], bassString: 3,
    }
    CHORD_OVERRIDES['D7/A'] = [custom]
    try {
      expect(chordDiagram('D7/A')).toEqual(custom)
    } finally {
      delete CHORD_OVERRIDES['D7/A']
    }
  })

  it('override do acorde base tem precedência no acorde puro', () => {
    const custom: ChordShape = {
      frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], baseFret: 1, barres: [],
    }
    CHORD_OVERRIDES['G'] = [custom]
    try {
      expect(chordDiagram('G')).toEqual(custom)
    } finally {
      delete CHORD_OVERRIDES['G']
    }
  })
})
