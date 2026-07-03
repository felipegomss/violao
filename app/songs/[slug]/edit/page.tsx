import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { updateSong } from '@/app/actions/songs'
import { AppSidebar } from '@/components/app-sidebar'
import { SongEditor } from '@/app/songs/song-editor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { userId } = await verifySession()
  const { slug } = await params
  const song = await prisma.song.findFirst({ where: { slug, userId }, select: { title: true } })
  return { title: song ? `Editar ${song.title}` : 'Editar música' }
}

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { userId } = await verifySession()
  const { slug } = await params
  const song = await prisma.song.findFirst({ where: { slug, userId } })
  if (!song) notFound()

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AppSidebar active="acervo" />
      <SongEditor
        action={updateSong.bind(null, song.id)}
        initialContent={song.chordContent}
        title="Editar"
        backHref={`/songs/${song.slug}`}
        submitLabel="Salvar alterações"
      />
    </div>
  )
}
