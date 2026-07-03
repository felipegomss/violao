import { NextResponse, type NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

// Rotas acessíveis sem sessão: login, verificação do magic link e repertórios
// compartilhados (/r/...). Prefixo para /auth/* e /r/* cobre as sub-rotas.
function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/r/')
  )
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = isPublicPath(pathname)

  const token = req.cookies.get('session')?.value
  const session = await decrypt(token)
  const isAuth = typeof session?.sub === 'string'

  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
  // Só o /login "chuta" quem já está logado — /auth/verify e /r/* devem seguir.
  if (isAuth && pathname === '/login') {
    return NextResponse.redirect(new URL('/songs', req.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
