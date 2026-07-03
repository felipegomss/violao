import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { AppSidebar } from '@/components/app-sidebar'
import { EmptyState } from '@/components/empty-state'
import { NovoRepertorio } from './novo-repertorio'

export default async function RepertoriosPage() {
  const { userId } = await verifySession()
  const reps = await prisma.repertoire.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      songs: {
        include: { song: { select: { title: true } } },
        orderBy: { order: 'asc' },
      },
    },
  })

  const totalSongs = reps.reduce((n, r) => n + r.songs.length, 0)

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AppSidebar active="repert" />
      <main className="mx-auto flex w-full max-w-7xl flex-col min-w-0">
        <header className="px-10 pt-8 flex justify-between items-start">
          <div>
            <h2 className="font-editorial font-semibold text-[32px] leading-none">
              Repertórios
            </h2>
            {/* único eyebrow da tela */}
            <div className="font-cifra text-[12px] text-faint mt-2 tracking-wide">
              {reps.length} pastas · {totalSongs} músicas no total
            </div>
          </div>
          <NovoRepertorio />
        </header>

        <div className="px-10 py-8 overflow-y-auto">
          {reps.length === 0 ? (
            <EmptyState title="Você ainda não tem repertórios. Cria o primeiro." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reps.map((rep) => {
                const count = rep.songs.length
                const preview = rep.songs.map((s) => s.song.title).join(' · ')
                return (
                  <Link
                    key={rep.id}
                    href={`/repertorios/${rep.id}`}
                    className="relative block overflow-hidden rounded-xl border border-ink/16 bg-[#fbf7ee] p-6 transition-shadow duration-150 hover:shadow-[0_8px_24px_-12px_rgba(38,33,27,.35)]"
                  >
                    {/* lombada do caderno */}
                    <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-teal" />
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-editorial font-semibold text-[24px] leading-tight">
                        {rep.name}
                      </h3>
                      <span className="font-cifra text-[12px] text-teal shrink-0">
                        {count} músicas
                      </span>
                    </div>
                    <div className="font-cifra text-[11px] leading-relaxed text-faint mt-3.5 truncate">
                      {preview}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
