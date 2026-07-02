import { NextResponse, type NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const PUBLIC_ROUTES = ['/login']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.includes(pathname)

  const token = req.cookies.get('session')?.value
  const session = await decrypt(token)
  const isAuth = session?.sub === 'owner'

  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
  if (isAuth && isPublic) {
    return NextResponse.redirect(new URL('/songs', req.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
