import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import { AppSidebar } from '@/components/app-sidebar'
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
            <h2 className="font-editorial font-medium text-[38px] leading-none">
              Repertórios
            </h2>
            <div className="font-cifra text-[12px] text-faint mt-2 tracking-wide">
              {reps.length} pastas · {totalSongs} músicas no total
            </div>
          </div>
          <NovoRepertorio />
        </header>

        <div className="px-10 py-8 overflow-y-auto">
          {reps.length === 0 ? (
            <p className="font-editorial italic text-faint text-[16px]">
              Nenhum repertório ainda — crie o primeiro.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reps.map((rep) => {
                const count = rep.songs.length
                const preview = rep.songs.map((s) => s.song.title).join(' · ')
                return (
                  <Link
                    key={rep.id}
                    href={`/repertorios/${rep.id}`}
                    className="block bg-[#fbf7ee] border border-ink/16 rounded-[4px] p-5 shadow-[4px_4px_0_#e6dcc8,8px_8px_0_#ded2bc] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-editorial font-medium text-[25px] leading-tight">
                        {rep.name}
                      </h3>
                      <span className="font-cifra text-[11px] text-folha bg-ink px-2 py-0.5 rounded shrink-0">
                        {count} músicas
                      </span>
                    </div>
                    <div className="font-cifra text-[11.5px] leading-relaxed text-[#9a9082] mt-3.5 truncate">
                      {preview}
                    </div>
                    <div className="font-cifra text-[10px] uppercase tracking-[.1em] text-rust mt-3">
                      abrir pasta →
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
