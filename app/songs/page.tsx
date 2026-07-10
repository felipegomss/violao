import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { searchSongs, songFacets } from '@/app/actions/songs'
import { AppShell } from '@/components/app-shell'
import { Acervo } from './acervo'

export const metadata = { title: 'Acervo' }

const SORTS = ['titulo', 'artista', 'toco'] as const
type SortKey = (typeof SORTS)[number]

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; artist?: string; sort?: string }>
}) {
  const { userId } = await verifySession()
  const sp = await searchParams
  // Mesmos params que a URL (nuqs) carrega — a 1ª página do SSR já bate com o
  // estado dos filtros, sem flash ao voltar pra tela.
  const query = sp.q?.trim() || undefined
  const genre = sp.genre && sp.genre !== 'todos' ? sp.genre : undefined
  const artist = sp.artist && sp.artist !== 'todos' ? sp.artist : undefined
  const sort: SortKey = SORTS.includes(sp.sort as SortKey) ? (sp.sort as SortKey) : 'titulo'

  const [initialSongs, facets, total] = await Promise.all([
    searchSongs({ q: query, genre, artist, sort, take: 40 }),
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
      />
    </AppShell>
  )
}
