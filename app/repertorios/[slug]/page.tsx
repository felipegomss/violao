import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { searchSongs } from '@/app/actions/songs'
import { AppSidebar } from '@/components/app-sidebar'
import { RepertorioDetalhe } from './repertorio-detalhe'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { userId } = await verifySession()
  const { slug } = await params
  const rep = await prisma.repertoire.findFirst({ where: { slug, userId }, select: { name: true } })
  return { title: rep?.name ?? 'Repertório' }
}

export default async function RepertorioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { userId } = await verifySession()
  const { slug } = await params
  const rep = await prisma.repertoire.findFirst({
    where: { slug, userId },
    include: {
      songs: { include: { song: true }, orderBy: { order: 'asc' }, take: 500 },
    },
  })
  if (!rep) notFound()

  const songIds = rep.songs.map((rs) => rs.songId)
  const others = await prisma.repertoireSong.findMany({
    where: {
      songId: { in: songIds },
      repertoireId: { not: rep.id },
      repertoire: { userId },
    },
    include: { repertoire: { select: { name: true } } },
  })
  const alsoMap = new Map<string, string[]>()
  for (const o of others) {
    const arr = alsoMap.get(o.songId) ?? []
    arr.push(o.repertoire.name)
    alsoMap.set(o.songId, arr)
  }

  const rows = rep.songs.map((rs) => ({
    songId: rs.songId,
    slug: rs.song.slug,
    title: rs.song.title,
    artist: rs.song.artists.join(', '),
    key: rs.song.key,
    comoEstouTocando: rs.song.comoEstouTocando,
    also: alsoMap.get(rs.songId) ?? [],
  }))

  // 1ª página do picker "adicionar música" (exclui as já no repertório).
  const initialAvailable = await searchSongs({ excludeRepId: rep.id, take: 30 })

  return (
    <div className="flex min-h-screen bg-paper text-ink max-md:pt-12">
      <AppSidebar active="repert" />
      <RepertorioDetalhe
        repertoireId={rep.id}
        repertoireSlug={rep.slug}
        name={rep.name}
        shareSlug={rep.shareSlug}
        rows={rows}
        initialAvailable={initialAvailable}
      />
    </div>
  )
}
