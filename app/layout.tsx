import type { Metadata } from 'next'
import { Newsreader, JetBrains_Mono } from 'next/font/google'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
