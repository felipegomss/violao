import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CompassoWordmark } from '@/components/compasso-wordmark'

// Rota PÚBLICA — sem verifySession, sem userId. A posse é validada só pelo
// shareSlug: quem tem o link vê, deslogado inclusive (o proxy libera /r/*).
export default async function PublicRepertoirePage({
  params,
}: {
  params: Promise<{ share: string }>
}) {
  const { share } = await params
  const rep = await prisma.repertoire.findFirst({
    where: { shareSlug: share },
    include: {
      user: { select: { name: true } },
      songs: {
        orderBy: { order: 'asc' },
        include: { song: { select: { slug: true, title: true, artists: true, key: true } } },
      },
    },
  })
  if (!rep) notFound()

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Compasso" className="text-ink">
            <CompassoWordmark size={22} />
          </Link>
          <div className="text-right">
            <span className="block font-cifra text-[11px] lowercase text-faint">
              repertório compartilhado
            </span>
            {rep.user.name && (
              <span className="mt-0.5 block font-editorial text-[14px] italic text-soft">
                por {rep.user.name}
              </span>
            )}
          </div>
        </div>

        <header className="mt-8">
          <h1 className="font-editorial text-[32px] font-semibold leading-none">{rep.name}</h1>
          <div className="mt-2 font-cifra text-[12px] lowercase text-faint">
            {rep.songs.length} músicas
          </div>
        </header>

        <div className="mt-6">
          {rep.songs.map((rs, i) => (
            <Link
              key={rs.songId}
              href={`/r/${share}/${rs.song.slug}`}
              className="-mx-2 flex items-center gap-5 border-b border-dotted border-ink/15 px-2 py-3 transition-colors duration-150 hover:bg-folha"
            >
              <span className="w-[34px] font-cifra text-[13px] text-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-editorial text-[19px] font-semibold leading-tight">
                  {rs.song.title}
                </span>
                <span className="block truncate font-editorial text-[14px] italic text-soft">
                  {rs.song.artists.join(', ')}
                </span>
              </span>
              <span className="shrink-0 font-cifra text-[13px] font-medium text-teal">
                {rs.song.key}
              </span>
            </Link>
          ))}
        </div>

        <footer className="mt-12 border-t border-dotted border-ink/15 pt-6">
          <Link
            href="/login"
            className="font-cifra text-[11px] lowercase text-faint transition-colors duration-150 hover:text-ink"
          >
            feito no Compasso
          </Link>
        </footer>
      </div>
    </div>
  )
}
