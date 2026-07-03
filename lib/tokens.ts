import { randomBytes, createHash } from 'node:crypto'

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now()
}
export const TOKEN_TTL_MS = 15 * 60 * 1000
