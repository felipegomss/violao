import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { updateSong } from '@/app/actions/songs'
import { SongEditor } from '@/app/songs/song-editor'

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifySession()
  const { id } = await params
  const song = await prisma.song.findUnique({ where: { id } })
  if (!song) notFound()

  const action = updateSong.bind(null, song.id)

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/songs/${song.id}`} className="text-sm text-muted-foreground hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Editar</h1>
      </div>
      <SongEditor action={action} initialContent={song.chordContent} submitLabel="Salvar alterações" />
    </main>
  )
}
