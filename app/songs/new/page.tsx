import { verifySession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSong } from '@/app/actions/songs'
import { AppShell } from '@/components/app-shell'
import { NewSongFlow } from './new-song-flow'

export const metadata = { title: 'Nova música' }

export default async function NewSongPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; mode?: string }>
}) {
  await verifySession()
  const { from, mode } = await searchParams
  const initialMode = mode === 'import' || mode === 'edit' ? mode : undefined

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
    <AppShell active="acervo" insetClassName="bg-paper text-ink">
      <NewSongFlow action={createSong} initialContent={initialContent} initialMode={initialMode} />
    </AppShell>
  )
}
