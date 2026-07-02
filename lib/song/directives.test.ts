import { describe, expect, it } from 'vitest'
import {
  parseDirectives,
  setDirective,
  toggleFormat,
  SCAFFOLD_TRADICIONAL,
  SCAFFOLD_GRADE,
} from './directives'

const tradFull = `{title: Minha Música}
{artist: Fulano}
{tom: C}
{genero: bossa nova, mpb}
{versao: Songbook}
{capo: 2}
{afinacao: standard}
{bpm: 90}
{youtube: https://youtu.be/abc}
{tipo: tradicional}
[C]Terra em [G]transe`

describe('parseDirectives', () => {
  it('extrai todos os campos de uma cifra tradicional completa', () => {
    const d = parseDirectives(tradFull)
    expect(d).toMatchObject({
      title: 'Minha Música',
      artist: 'Fulano',
      key: 'C',
      genres: ['bossa nova', 'mpb'],
      version: 'Songbook',
      capo: 2,
      tuning: 'standard',
      bpm: 90,
      referenceYoutubeUrl: 'https://youtu.be/abc',
      chordFormat: 'TRADICIONAL',
    })
  })

  it('mapeia {tipo: grade} para chordFormat GRADE', () => {
    const d = parseDirectives('{title: X}\n{tipo: grade}\n| C |')
    expect(d.chordFormat).toBe('GRADE')
  })

  it('diretiva ausente → campo vazio/undefined, sem quebrar', () => {
    const d = parseDirectives('{title: X}\n{artist: Y}\n{tom: C}')
    expect(d.bpm).toBeUndefined()
    expect(d.version).toBeUndefined()
    expect(d.genres).toEqual([])
    expect(d.tuning).toBe('standard')
  })

  it('{genero: a, b} → array', () => {
    expect(parseDirectives('{genero: bossa nova, mpb}').genres).toEqual([
      'bossa nova',
      'mpb',
    ])
  })

  it('capo/bpm inteiros; valor inválido → undefined sem derrubar', () => {
    expect(parseDirectives('{capo: 2}\n{bpm: 90}').capo).toBe(2)
    expect(parseDirectives('{capo: 2}\n{bpm: 90}').bpm).toBe(90)
    const d = parseDirectives('{capo: abc}\n{bpm: xyz}')
    expect(d.capo).toBeUndefined()
    expect(d.bpm).toBeUndefined()
  })

  it('diretiva desconhecida é ignorada na extração e preservada no texto', () => {
    const content = '{foo: bar}\n{title: X}\n[C]oi'
    const d = parseDirectives(content)
    expect(d.title).toBe('X')
    expect(content).toContain('{foo: bar}')
  })
})

describe('setDirective (round-trip)', () => {
  it('reescreve a diretiva existente', () => {
    const c = setDirective(tradFull, 'bpm', '120')
    expect(parseDirectives(c).bpm).toBe(120)
  })

  it('insere a diretiva quando ausente', () => {
    const c = setDirective('[C]oi', 'tom', 'D')
    expect(parseDirectives(c).key).toBe('D')
  })

  it('preserva o resto do conteúdo', () => {
    const c = setDirective(tradFull, 'tom', 'D')
    expect(c).toContain('[C]Terra em [G]transe')
    expect(parseDirectives(c).key).toBe('D')
    expect(parseDirectives(c).title).toBe('Minha Música')
  })
})

describe('toggleFormat', () => {
  it('scaffold intocado → troca o scaffold inteiro', () => {
    expect(toggleFormat(SCAFFOLD_TRADICIONAL, 'GRADE')).toBe(SCAFFOLD_GRADE)
    expect(toggleFormat(SCAFFOLD_GRADE, 'TRADICIONAL')).toBe(SCAFFOLD_TRADICIONAL)
  })

  it('conteúdo editado → só troca {tipo}, preserva o corpo', () => {
    const edited = setDirective(SCAFFOLD_TRADICIONAL, 'title', 'X') + '\n[Am]coisa'
    const toggled = toggleFormat(edited, 'GRADE')
    expect(parseDirectives(toggled).chordFormat).toBe('GRADE')
    expect(toggled).toContain('[Am]coisa')
    expect(parseDirectives(toggled).title).toBe('X')
  })
})
