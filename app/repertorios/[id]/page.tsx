import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { AppSidebar } from '@/components/app-sidebar'
import { RepertorioDetalhe } from './repertorio-detalhe'

export default async function RepertorioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifySession()
  const { id } = await params
  const rep = await prisma.repertoire.findUnique({
    where: { id },
    include: {
      songs: { include: { song: true }, orderBy: { order: 'asc' } },
    },
  })
  if (!rep) notFound()

  const songIds = rep.songs.map((rs) => rs.songId)
  const others = await prisma.repertoireSong.findMany({
    where: { songId: { in: songIds }, repertoireId: { not: id } },
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
    title: rs.song.title,
    artist: rs.song.artists.join(', '),
    key: rs.song.key,
    comoEstouTocando: rs.song.comoEstouTocando,
    also: alsoMap.get(rs.songId) ?? [],
  }))

  const inIds = new Set(songIds)
  const allSongs = await prisma.song.findMany({
    orderBy: { title: 'asc' },
    select: { id: true, title: true, artists: true, key: true, comoEstouTocando: true },
  })
  const available = allSongs
    .filter((s) => !inIds.has(s.id))
    .map((s) => ({
      id: s.id,
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
        name={rep.name}
        rows={rows}
        available={available}
      />
    </div>
  )
}
