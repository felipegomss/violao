import { verifySession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSong } from '@/app/actions/songs'
import { AppSidebar } from '@/components/app-sidebar'
import { NewSongFlow } from './new-song-flow'

export const metadata = { title: 'Nova música' }

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
      <NewSongFlow action={createSong} initialContent={initialContent} />
    </div>
  )
}
