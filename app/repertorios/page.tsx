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
                    href={`/repertorios/${rep.slug}`}
                    className="block rounded-xl border border-ink/16 bg-[#fbf7ee] p-6 transition-colors duration-150 hover:border-ink/35"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="truncate font-editorial font-semibold text-[24px] leading-tight">
                        {rep.name}
                      </h3>
                      <span className="font-cifra text-[12px] text-faint shrink-0">
                        {count} músicas
                      </span>
                    </div>
                    <div className="mt-4 truncate border-t border-dotted border-ink/15 pt-3 font-editorial text-[14px] italic text-soft">
                      {preview || 'ainda sem músicas'}
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
