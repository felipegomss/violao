import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const encodedKey = () => {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET não configurada')
  return new TextEncoder().encode(secret)
}

export async function encrypt(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encodedKey())
}

export async function decrypt(
  token: string | undefined,
): Promise<JWTPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, encodedKey(), {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}
