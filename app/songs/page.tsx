import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { searchSongs, songFacets } from '@/app/actions/songs'
import { AppSidebar } from '@/components/app-sidebar'
import { Acervo } from './acervo'

export const metadata = { title: 'Acervo' }

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { userId } = await verifySession()
  const { q } = await searchParams
  const query = q?.trim() || undefined
  const [initialSongs, facets, total] = await Promise.all([
    searchSongs({ q: query, sort: 'titulo', take: 40 }),
    songFacets(),
    prisma.song.count({ where: { userId } }),
  ])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper max-md:pt-12">
      <AppSidebar active="acervo" />
      <Acervo
        initialSongs={initialSongs}
        genres={facets.genres}
        artists={facets.artists}
        total={total}
        initialQ={query ?? ''}
      />
    </div>
  )
}
