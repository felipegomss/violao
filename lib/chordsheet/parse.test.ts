import { describe, expect, it } from 'vitest'
import { parseChordSheet } from './parse'

describe('parseChordSheet', () => {
  it('mapeia pares acorde/letra', () => {
    const line = parseChordSheet('[C]Terra em [G]transe').lines[0]
    expect(line.type).toBe('row')
    if (line.type === 'row') {
      expect(line.items[0]).toEqual({ chord: 'C', lyrics: 'Terra ' })
      expect(line.items.some((i) => i.chord === 'G')).toBe(true)
    }
  })

  it('preserva notação BR e baixo invertido verbatim', () => {
    const line = parseChordSheet('[F#m7(5-)]Nota [G/B]baixo').lines[0]
    expect(line.type).toBe('row')
    if (line.type === 'row') {
      expect(line.items[0].chord).toBe('F#m7(5-)')
      expect(line.items[1].chord).toBe('G/B')
    }
  })

  it('linha só de acordes vira row', () => {
    const line = parseChordSheet('[C] [G] [Am]').lines[0]
    expect(line.type).toBe('row')
    if (line.type === 'row') {
      expect(line.items.map((i) => i.chord)).toEqual(['C', 'G', 'Am'])
    }
  })

  it('linha só de letra (sem acordes) vira row com chord null', () => {
    const line = parseChordSheet('Só a letra, sem acorde').lines[0]
    expect(line.type).toBe('row')
    if (line.type === 'row') {
      expect(line.items).toHaveLength(1)
      expect(line.items[0].chord).toBeNull()
      expect(line.items[0].lyrics).toBe('Só a letra, sem acorde')
    }
  })

  it('{comment} vira label', () => {
    const { lines } = parseChordSheet('{comment: Intro}')
    expect(lines[0]).toEqual({ type: 'label', text: 'Intro' })
  })

  it('{start_of_verse: X} vira label com o rótulo da seção', () => {
    const { lines } = parseChordSheet('{start_of_verse: Verso 1}\n[C]oi')
    expect(lines[0]).toEqual({ type: 'label', text: 'Verso 1' })
  })

  it('ignora metadados {title}/{artist}', () => {
    const rows = parseChordSheet('{title: X}\n{artist: Y}\n[C]oi').lines.filter(
      (l) => l.type === 'row',
    )
    expect(rows).toHaveLength(1)
  })

  it('não emite label/row para metadados', () => {
    const meaningful = parseChordSheet('{title: X}').lines.filter(
      (l) => l.type === 'label' || l.type === 'row',
    )
    expect(meaningful).toEqual([])
  })

  it('linha em branco vira empty', () => {
    const { lines } = parseChordSheet('[C]oi\n\n[G]tchau')
    expect(lines.some((l) => l.type === 'empty')).toBe(true)
  })

  it('ignora fim de seção sem label', () => {
    const meaningful = parseChordSheet('{end_of_verse}').lines.filter(
      (l) => l.type === 'label' || l.type === 'row',
    )
    expect(meaningful).toEqual([])
  })
})
