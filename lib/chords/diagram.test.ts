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

  it('normaliza as várias grafias pro mesmo acorde', () => {
    // cada grafia à esquerda tem que cair no mesmo shape da forma canônica à direita
    const pares: [string, string][] = [
      ['C4', 'Csus4'],
      ['C7(4)', 'C7sus4'],
      ['C7+', 'Cmaj7'],
      ['CMaj7', 'Cmaj7'],
      ['C7(9)', 'C9'],
      ['C6/9', 'C69'],
      ['Cm7(b5)', 'Cm7b5'],
      ['Cm7(-5)', 'Cm7b5'],
      ['C7(#5)', 'Caug7'],
      ['C+', 'Caug'],
      ['C°', 'Cdim7'],
      ['Cº', 'Cdim7'],
      ['Co', 'Cdim7'],
      ['Cm(7M)', 'Cmmaj7'],
      ['C7(b9)', 'C7b9'],
      ['C7(9+)', 'C7#9'],
    ]
    for (const [escrita, canonico] of pares) {
      expect(chordDiagram(escrita), `${escrita} → ${canonico}`).toEqual(chordDiagram(canonico))
      expect(chordDiagram(escrita), `${escrita} devia existir`).not.toBeNull()
    }
  })

  it('6(9)/6/9 caem no 69 do db, e 7(b13)/7(13-) no aug7', () => {
    expect(chordDiagram('D6(9)')).toEqual(chordDiagram('D69'))
    expect(chordDiagram('D6/9')).toEqual(chordDiagram('D69'))
    expect(chordDiagram('F#7(b13)')).toEqual(chordDiagram('F#aug7'))
    expect(chordDiagram('F#7(13-)')).toEqual(chordDiagram('F#aug7'))
    expect(chordDiagram('F#7(b13)')).not.toBeNull()
  })

  it('° (grau) é dim7, não a tríade dim', () => {
    expect(chordDiagram('C°')).toEqual(chordDiagram('Cdim7'))
    expect(chordDiagram('Cdim')).not.toEqual(chordDiagram('Cdim7'))
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

  it('acorde com baixo sem entrada no db nem override não gera nada, mas parece acorde', () => {
    // sem geração automática: mostramos "sem digitação" e o usuário manda o shape
    expect(chordPositions('C7/E')).toEqual([])
    expect(looksLikeChord('C7/E')).toBe(true)
  })

  it('looksLikeChord separa acorde de token não-acorde', () => {
    expect(looksLikeChord('N.C.')).toBe(false)
    expect(looksLikeChord('%')).toBe(false)
    expect(looksLikeChord('Bm7')).toBe(true)
  })

  it("não confunde barra de baixo com '/' interno (C7M(6/11+) não vira acorde com baixo)", () => {
    // termina em '+)', não em /Nota → token único (sem override e sem db → vazio, não split)
    expect(chordPositions('C7M(6/11+)')).toEqual([])
    expect(looksLikeChord('C7M(6/11+)')).toBe(true)
  })

  it('A7M(6/11+) resolve pelo override (corda solta + casas altas)', () => {
    const p = chordDiagram('A7M(6/11+)')!
    expect(p.frets).toEqual([-1, 0, 4, 6, 4, 4])
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

  it('A7(4/9) e A7sus4(9) são a mesma coisa e não têm 3ª (não é o A11 do db)', () => {
    const a = chordPositions('A7(4/9)')
    expect(a).toEqual(chordPositions('A7sus4(9)'))
    expect(a.length).toBeGreaterThan(0)
    // primeira digitação é a aberta x00000
    expect(a[0].frets).toEqual([-1, 0, 0, 0, 0, 0])
    // db "11" (que tem 3ª) não é o que usamos
    expect(a).not.toEqual(chordPositions('A11'))
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
