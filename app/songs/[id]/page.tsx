import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { deleteSong } from '@/app/actions/songs'
import { Button } from '@/components/ui/button'

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifySession()
  const { id } = await params
  const song = await prisma.song.findUnique({ where: { id } })
  if (!song) notFound()

  const deleteThis = deleteSong.bind(null, song.id)

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/songs" className="text-sm text-muted-foreground hover:underline">
            ← Músicas
          </Link>
          <h1 className="text-2xl font-semibold">
            {song.title}{' '}
            <span className="font-normal text-muted-foreground">— {song.artist}</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href={`/songs/${song.id}/edit`}>Editar</Link>
          </Button>
          <form action={deleteThis}>
            <Button type="submit" variant="destructive">Apagar</Button>
          </form>
        </div>
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <Meta label="Tom" value={song.key} />
        <Meta label="Status" value={song.status} />
        <Meta label="Formato" value={song.chordFormat} />
        <Meta label="Afinação" value={song.tuning} />
        {song.capo != null && <Meta label="Capo" value={String(song.capo)} />}
        {song.bpm != null && <Meta label="BPM" value={String(song.bpm)} />}
        {song.difficulty != null && <Meta label="Dificuldade" value={String(song.difficulty)} />}
        {song.version && <Meta label="Versão" value={song.version} />}
        {song.genres.length > 0 && <Meta label="Gêneros" value={song.genres.join(', ')} />}
      </dl>

      {song.referenceYoutubeUrl && (
        <p className="mb-6 text-sm">
          Referência:{' '}
          <a href={song.referenceYoutubeUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            {song.referenceYoutubeUrl}
          </a>
        </p>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Cifra</h2>
        <pre className="overflow-x-auto rounded-md border bg-muted p-4 font-mono text-sm">
          {song.chordContent || '(vazio)'}
        </pre>
      </section>

      {song.notes && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Anotações</h2>
          <p className="whitespace-pre-wrap text-sm">{song.notes}</p>
        </section>
      )}
    </main>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
