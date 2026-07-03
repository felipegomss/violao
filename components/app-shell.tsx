import type { CSSProperties, ReactNode } from 'react'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { searchSongs } from '@/app/actions/songs'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { NameGate } from '@/components/name-gate'
import { CompassoWordmark } from '@/components/compasso-wordmark'
import { AppSidebar, type SidebarContext } from '@/components/app-sidebar'

// Casca das páginas autenticadas: SidebarProvider (shadcn) + a sidebar do
// Compasso + o conteúdo (SidebarInset). Busca a 1ª página do acervo pra sidebar
// e lê o cookie de estado (aberta/recolhida) pra SSR sem flash.
export async function AppShell({
  active,
  context,
  children,
  insetClassName,
}: {
  active: 'acervo' | 'repert'
  context?: SidebarContext
  children: ReactNode
  insetClassName?: string
}) {
  const session = await getSession()
  const [user, songs, cookieStore] = await Promise.all([
    session
      ? prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
      : null,
    session ? searchSongs({ sort: 'recent', take: 6 }) : [],
    cookies(),
  ])
  const open = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <>
      <NameGate needsName={!!session && !user?.name} />
      <SidebarProvider
        defaultOpen={open}
        className="bg-paper"
        style={{ '--sidebar-width': '18rem', '--sidebar-width-icon': '3.75rem' } as CSSProperties}
      >
        <AppSidebar active={active} songs={songs} context={context} />
        <SidebarInset className={insetClassName ?? 'bg-paper'}>
          {/* topbar mobile: abre o menu (sheet) */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ink/12 px-2 md:hidden">
            <SidebarTrigger className="text-ink" />
            <CompassoWordmark size={19} />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
