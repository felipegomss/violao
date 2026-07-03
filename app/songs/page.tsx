import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { searchSongs, songFacets } from '@/app/actions/songs'
import { AppShell } from '@/components/app-shell'
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
    <AppShell active="acervo" insetClassName="bg-paper h-svh overflow-hidden">
      <Acervo
        initialSongs={initialSongs}
        genres={facets.genres}
        artists={facets.artists}
        total={total}
        initialQ={query ?? ''}
      />
    </AppShell>
  )
}
