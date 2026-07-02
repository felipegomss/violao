import { describe, expect, it } from 'vitest'
import { SongSchema } from './song'

const valid = {
  title: 'Carta ao Tom 74',
  artist: 'Toquinho',
  key: 'C',
  genres: ['MPB'],
  status: 'APRENDENDO',
  chordFormat: 'GRADE',
  chordContent: '| C7M | G/B |',
}

describe('SongSchema', () => {
  it('aceita payload mínimo válido', () => {
    expect(SongSchema.safeParse(valid).success).toBe(true)
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

  it('rejeita difficulty fora de 1–5', () => {
    expect(SongSchema.safeParse({ ...valid, difficulty: 9 }).success).toBe(false)
    expect(SongSchema.safeParse({ ...valid, difficulty: 0 }).success).toBe(false)
  })

  it('rejeita status/chordFormat inválidos', () => {
    expect(SongSchema.safeParse({ ...valid, status: 'X' }).success).toBe(false)
    expect(SongSchema.safeParse({ ...valid, chordFormat: 'Y' }).success).toBe(false)
  })

  it('rejeita referenceYoutubeUrl malformada', () => {
    expect(
      SongSchema.safeParse({ ...valid, referenceYoutubeUrl: 'nao-e-url' }).success,
    ).toBe(false)
  })

  it('aceita opcionais ausentes e aplica default de tuning', () => {
    const r = SongSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.tuning).toBe('standard')
  })
})
