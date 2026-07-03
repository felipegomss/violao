import { describe, expect, it } from 'vitest'
import { generateToken, hashToken, isExpired } from './tokens'

describe('tokens', () => {
  it('generateToken é aleatório e url-safe', () => {
    const a = generateToken(), b = generateToken()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(a.length).toBeGreaterThan(20)
  })
  it('hashToken é determinístico e não é o token cru', () => {
    const t = generateToken()
    expect(hashToken(t)).toBe(hashToken(t))
    expect(hashToken(t)).not.toBe(t)
  })
  it('isExpired', () => {
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true)
    expect(isExpired(new Date(Date.now() + 60_000))).toBe(false)
  })
})
