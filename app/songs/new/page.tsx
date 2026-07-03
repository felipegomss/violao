import { verifySession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSong } from '@/app/actions/songs'
import { AppSidebar } from '@/components/app-sidebar'
import { SongEditor } from '@/app/songs/song-editor'

export default async function NewSongPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  await verifySession()
  const { from } = await searchParams

  // "Adicionar ao meu acervo": pré-carrega a cifra de uma música que esteja num
  // repertório PÚBLICO (shareSlug != null). Sem esse gate, qualquer um puxaria
  // cifra privada só pelo id interno.
  let initialContent: string | undefined
  if (from) {
    const src = await prisma.song.findFirst({
      where: {
        id: from,
        repertoires: { some: { repertoire: { shareSlug: { not: null } } } },
      },
      select: { chordContent: true },
    })
    if (src) initialContent = src.chordContent
  }

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AppSidebar active="acervo" />
      <SongEditor
        action={createSong}
        title="Nova música"
        backHref="/songs"
        submitLabel="Criar música"
        initialContent={initialContent}
      />
    </div>
  )
}
