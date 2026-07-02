import type { Metadata } from 'next'
import { Newsreader, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { logout } from '@/app/actions/auth'
import './globals.css'

// DS editorial "Caderno" — carregadas como CSS vars (font-editorial / font-cifra).
// Não trocam a fonte default do body; usadas por classe nas telas editoriais.
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  variable: '--font-newsreader',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jbmono',
})

export const metadata: Metadata = {
  title: 'Estudo de Violão',
  description: 'Repertório, cifras e prática de violão',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuth = (await getSession()) !== null

  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {isAuth && (
          <header className="border-b">
            <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
              <Link href="/songs" className="font-semibold">
                🎸 Estudo de Violão
              </Link>
              <form action={logout}>
                <button type="submit" className="text-sm text-muted-foreground hover:underline">
                  Sair
                </button>
              </form>
            </div>
          </header>
        )}
        {children}
      </body>
    </html>
  )
}
