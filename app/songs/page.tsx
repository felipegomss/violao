import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default async function SongsPage() {
  await verifySession()
  const songs = await prisma.song.findMany({ orderBy: { updatedAt: 'desc' } })

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Músicas</h1>
        <Button render={<Link href="/songs/new">Nova música</Link>} />
      </div>

      {songs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="mb-4">Nenhuma música ainda.</p>
          <Button render={<Link href="/songs/new">Adicionar a primeira</Link>} />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {songs.map((s) => (
            <li key={s.id}>
              <Link
                href={`/songs/${s.id}`}
                className="flex items-center justify-between rounded-md border p-4 hover:bg-accent"
              >
                <span>
                  <span className="font-medium">{s.title}</span>{' '}
                  <span className="text-muted-foreground">— {s.artist}</span>
                </span>
                <span className="text-sm text-muted-foreground">{s.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
