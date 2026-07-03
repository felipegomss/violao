import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { searchSongs, songFacets } from '@/app/actions/songs'
import { AppSidebar } from '@/components/app-sidebar'
import { Acervo } from './acervo'

export const metadata = { title: 'Acervo' }

export default async function SongsPage() {
  const { userId } = await verifySession()
  const [initialSongs, facets, total] = await Promise.all([
    searchSongs({ sort: 'titulo', take: 40 }),
    songFacets(),
    prisma.song.count({ where: { userId } }),
  ])

  return (
    <div className="flex min-h-screen bg-paper max-md:pt-12">
      <AppSidebar active="acervo" />
      <Acervo
        initialSongs={initialSongs}
        genres={facets.genres}
        artists={facets.artists}
        total={total}
      />
    </div>
  )
}
