import Link from 'next/link'
import { verifySession } from '@/lib/auth'
import { createSong } from '@/app/actions/songs'
import { SongEditor } from '@/app/songs/song-editor'

export default async function NewSongPage() {
  await verifySession()
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/songs" className="text-sm text-muted-foreground hover:underline">
          ← Músicas
        </Link>
        <h1 className="text-2xl font-semibold">Nova música</h1>
      </div>
      <SongEditor action={createSong} submitLabel="Criar" />
    </main>
  )
}
