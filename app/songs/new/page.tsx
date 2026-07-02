import { verifySession } from '@/lib/auth'
import { createSong } from '@/app/actions/songs'
import { AppSidebar } from '@/components/app-sidebar'
import { SongEditor } from '@/app/songs/song-editor'

export default async function NewSongPage() {
  await verifySession()
  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AppSidebar active="acervo" />
      <SongEditor action={createSong} title="Nova música" backHref="/songs" submitLabel="Criar música" />
    </div>
  )
}
