import { describe, expect, it } from 'vitest'
import { SongSchema } from './song'

const valid = {
  title: 'Carta ao Tom 74',
  artist: 'Toquinho',
  key: 'C',
  genres: ['MPB'],
  chordFormat: 'GRADE',
}

describe('SongSchema', () => {
  it('aceita payload mínimo válido e aplica default de tuning', () => {
    const r = SongSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.tuning).toBe('standard')
  })

  it('exige title, artist e key', () => {
    const r = SongSchema.safeParse({ ...valid, title: '', artist: '', key: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      const f = r.error.flatten().fieldErrors
      expect(f.title).toBeDefined()
      expect(f.artist).toBeDefined()
      expect(f.key).toBeDefined()
    }
  })

  it('rejeita chordFormat inválido', () => {
    expect(SongSchema.safeParse({ ...valid, chordFormat: 'X' }).success).toBe(false)
  })

  it('rejeita referenceYoutubeUrl malformada', () => {
    expect(
      SongSchema.safeParse({ ...valid, referenceYoutubeUrl: 'nao-e-url' }).success,
    ).toBe(false)
  })
})
