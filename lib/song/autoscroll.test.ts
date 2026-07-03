import { describe, expect, it } from 'vitest'
import { suggestScrollSpeed } from './autoscroll'

describe('suggestScrollSpeed', () => {
  it('sem bpm → padrão suave', () => {
    expect(suggestScrollSpeed({ scrollable: 2000, rows: 50, bpm: null })).toBe(14)
  })

  it('sem conteúdo mensurável → padrão', () => {
    expect(suggestScrollSpeed({ scrollable: 0, rows: 0, bpm: 120 })).toBe(14)
  })

  it('deriva da duração (bpm × página)', () => {
    // 50 linhas × 6 beats × 60 / 120bpm = 150s; 2000/150 ≈ 13
    expect(suggestScrollSpeed({ scrollable: 2000, rows: 50, bpm: 120 })).toBe(13)
  })

  it('clampa em cima e embaixo', () => {
    expect(suggestScrollSpeed({ scrollable: 5000, rows: 5, bpm: 200 })).toBe(80)
    expect(suggestScrollSpeed({ scrollable: 100, rows: 100, bpm: 40 })).toBe(4)
  })

  it('bpm maior → mais rápido', () => {
    const slow = suggestScrollSpeed({ scrollable: 2000, rows: 50, bpm: 80 })
    const fast = suggestScrollSpeed({ scrollable: 2000, rows: 50, bpm: 160 })
    expect(fast).toBeGreaterThan(slow)
  })
})
