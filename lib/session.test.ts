import { beforeAll, describe, expect, it } from 'vitest'
import { encrypt, decrypt, verifyPassword } from './session'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-please-change-32bytes-long'
  process.env.APP_PASSWORD = 'senha-correta'
})

describe('encrypt/decrypt', () => {
  it('faz roundtrip do payload', async () => {
    const token = await encrypt({ sub: 'owner' })
    const payload = await decrypt(token)
    expect(payload?.sub).toBe('owner')
  })

  it('rejeita token adulterado', async () => {
    const token = await encrypt({ sub: 'owner' })
    const tampered = token.slice(0, -3) + 'xyz'
    const payload = await decrypt(tampered)
    expect(payload).toBeNull()
  })

  it('rejeita lixo', async () => {
    expect(await decrypt('not-a-jwt')).toBeNull()
    expect(await decrypt(undefined)).toBeNull()
  })

  it('rejeita token expirado', async () => {
    const { SignJWT } = await import('jose')
    const key = new TextEncoder().encode(process.env.SESSION_SECRET)
    const expired = await new SignJWT({ sub: 'owner' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('-1s')
      .sign(key)
    expect(await decrypt(expired)).toBeNull()
  })
})

describe('verifyPassword', () => {
  it('aceita a senha correta', () => {
    expect(verifyPassword('senha-correta')).toBe(true)
  })
  it('rejeita senha errada', () => {
    expect(verifyPassword('errada')).toBe(false)
  })
  it('rejeita senha de tamanho diferente', () => {
    expect(verifyPassword('x')).toBe(false)
  })
})
