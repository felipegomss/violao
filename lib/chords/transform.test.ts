import { describe, expect, it } from 'vitest'
import { transposeChord, degreeChord } from './transform'

describe('transposeChord', () => {
  it('desloca a fundamental em semitons, mantém o sufixo', () => {
    expect(transposeChord('C', 2)).toBe('D')
    expect(transposeChord('Cm7', 2)).toBe('Dm7')
    expect(transposeChord('B', 1)).toBe('C')
    expect(transposeChord('C', -1)).toBe('B')
  })

  it('transpõe também o baixo depois do /', () => {
    expect(transposeChord('G/B', 2)).toBe('A/C#')
  })

  it('preserva notação BR (sufixo literal)', () => {
    expect(transposeChord('F#m7(5-)', 1)).toBe('Gm7(5-)')
    expect(transposeChord('C7M', 0)).toBe('C7M')
  })

  it('normaliza bemol de entrada ao transpor', () => {
    expect(transposeChord('Bb', 1)).toBe('B')
  })

  it('transpose 0 mantém o acorde original (sem renormalizar)', () => {
    expect(transposeChord('Bb7', 0)).toBe('Bb7')
  })

  it('deixa tokens não-acorde intactos', () => {
    expect(transposeChord('%', 2)).toBe('%')
    expect(transposeChord('N.C.', 2)).toBe('N.C.')
  })
})

describe('degreeChord', () => {
  it('converte a fundamental em grau relativo ao tom, sufixo literal', () => {
    expect(degreeChord('C', 'C')).toBe('I')
    expect(degreeChord('G', 'C')).toBe('V')
    expect(degreeChord('Am7', 'C')).toBe('VIm7')
    expect(degreeChord('F#m7(5-)', 'C')).toBe('#IVm7(5-)')
  })

  it('baixo depois do / vira grau também', () => {
    expect(degreeChord('G/B', 'C')).toBe('V/VII')
  })

  it('usa a fundamental do tom mesmo com qualidade (ex.: Cm)', () => {
    expect(degreeChord('Cm7', 'Cm')).toBe('Im7')
    expect(degreeChord('Bbm7', 'Cm')).toBe('bVIIm7')
  })

  it('deixa token não-acorde / tom inválido intactos', () => {
    expect(degreeChord('%', 'C')).toBe('%')
    expect(degreeChord('C', '?')).toBe('C')
  })
})
