import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
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
      songs: { include: { song: true }, orderBy: { order: 'asc' } },
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

  const inIds = new Set(songIds)
  const allSongs = await prisma.song.findMany({
    where: { userId },
    orderBy: { title: 'asc' },
    select: { id: true, slug: true, title: true, artists: true, key: true, comoEstouTocando: true },
  })
  const available = allSongs
    .filter((s) => !inIds.has(s.id))
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      artist: s.artists.join(', '),
      key: s.key,
      comoEstouTocando: s.comoEstouTocando,
    }))

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AppSidebar active="repert" />
      <RepertorioDetalhe
        repertoireId={rep.id}
        repertoireSlug={rep.slug}
        name={rep.name}
        shareSlug={rep.shareSlug}
        rows={rows}
        available={available}
      />
    </div>
  )
}
