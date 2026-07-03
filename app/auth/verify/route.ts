import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken, isExpired } from '@/lib/tokens'
import { createSession } from '@/lib/auth'

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
  await createSession(user.id)
  return NextResponse.redirect(new URL('/songs', req.nextUrl))
}
