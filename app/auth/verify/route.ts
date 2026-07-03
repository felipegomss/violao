import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken, isExpired } from '@/lib/tokens'
import { buildSessionCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const fail = () => NextResponse.redirect(new URL('/login?erro=link', req.nextUrl))
  if (!token) return fail()

  const row = await prisma.magicLinkToken.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!row || row.usedAt || isExpired(row.expiresAt)) return fail()

  await prisma.magicLinkToken.update({ where: { id: row.id }, data: { usedAt: new Date() } })
  const user = await prisma.user.upsert({
    where: { email: row.email },
    update: {},
    create: { email: row.email },
  })
  // Seta o cookie DIRETO na resposta de redirect (senão o Set-Cookie se perde).
  const { name, value, options } = await buildSessionCookie(user.id)
  const res = NextResponse.redirect(new URL('/songs', req.nextUrl))
  res.cookies.set(name, value, options)
  return res
}
