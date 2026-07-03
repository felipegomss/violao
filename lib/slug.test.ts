import { describe, expect, it } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('minúsculo, sem acento, hifeniza espaços', () => {
    expect(slugify('Nos Braços da Batucada')).toBe('nos-bracos-da-batucada')
    expect(slugify('Você')).toBe('voce')
    expect(slugify('Carta ao Tom 74')).toBe('carta-ao-tom-74')
  })

  it('colapsa separadores e apara as bordas', () => {
    expect(slugify('  Olá!!  mundo ')).toBe('ola-mundo')
    expect(slugify('A/B — C')).toBe('a-b-c')
  })

  it('fallback quando não sobra nada', () => {
    expect(slugify('---')).toBe('musica')
    expect(slugify('!!!')).toBe('musica')
  })

  it('limita o tamanho', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(80)
  })
})
