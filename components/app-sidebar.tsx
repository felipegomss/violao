import { cookies } from 'next/headers'
import { NameGate } from '@/components/name-gate'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SidebarShell, type SidebarContext } from '@/components/sidebar/sidebar-shell'

type ActiveSection = 'acervo' | 'repert'

// Orquestrador server: sessão (NameGate), preferência de expansão (cookie) e o
// acervo do usuário; a UI interativa vive no SidebarShell (client). `context` só
// é passado pela página da música (setlist do repertório + música atual).
export async function AppSidebar({
  active,
  context,
}: {
  active: ActiveSection
  context?: SidebarContext
}) {
  const session = await getSession()
  const [user, songs, cookieStore] = await Promise.all([
    session
      ? prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
      : null,
    session
      ? prisma.song.findMany({
          where: { userId: session.userId },
          orderBy: { updatedAt: 'desc' },
          select: { slug: true, title: true, artists: true, key: true },
        })
      : [],
    cookies(),
  ])

  const initialExpanded = cookieStore.get('sidebar')?.value === '1'

  return (
    <>
      <NameGate needsName={!!session && !user?.name} />
      <SidebarShell
        initialExpanded={initialExpanded}
        active={active}
        songs={songs}
        context={context}
      />
    </>
  )
}
