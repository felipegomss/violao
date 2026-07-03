import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { AppSidebar } from '@/components/app-sidebar'
import { Acervo } from './acervo'

export default async function SongsPage() {
  const { userId } = await verifySession()
  const songs = await prisma.song.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="flex min-h-screen bg-paper">
      <AppSidebar active="acervo" />
      <Acervo
        songs={songs.map((s) => ({
          id: s.id,
          title: s.title,
          artists: s.artists,
          genres: s.genres,
          key: s.key,
          comoEstouTocando: s.comoEstouTocando,
        }))}
      />
    </div>
  )
}
