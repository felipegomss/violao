import Link from 'next/link'
import { logout } from '@/app/actions/auth'

type ActiveSection = 'acervo' | 'repert' | 'progr'

export function AppSidebar({ active }: { active: ActiveSection }) {
  return (
    <nav className="hidden min-h-screen w-[76px] flex-none flex-col items-center gap-1.5 border-r border-ink/12 bg-[#efe7d5] py-5 md:flex">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[9px] bg-ink font-editorial text-lg font-semibold text-folha">
        C
      </div>

      <Link
        href="/songs"
        className={
          active === 'acervo'
            ? 'flex w-full flex-col items-center gap-1.5 border-l-2 border-teal bg-folha py-2.5 text-teal'
            : 'flex w-full flex-col items-center gap-1.5 py-2.5 text-faint'
        }
      >
        <span
          className={`h-5 w-5 rounded-[3px] border-[1.5px] ${
            active === 'acervo' ? 'border-teal' : 'border-faint'
          }`}
        />
        <span className="font-cifra text-[8px] uppercase tracking-wide">acervo</span>
      </Link>

      <div
        className={
          active === 'repert'
            ? 'flex w-full flex-col items-center gap-1.5 border-l-2 border-teal bg-folha py-2.5 text-teal'
            : 'flex w-full flex-col items-center gap-1.5 py-2.5 text-faint'
        }
      >
        <span
          className={`h-4 w-5 rounded-t-[5px] border-[1.5px] border-t-[5px] ${
            active === 'repert' ? 'border-teal' : 'border-faint'
          }`}
        />
        <span className="font-cifra text-[8px] uppercase tracking-wide">repertório</span>
      </div>

      <div
        className={
          active === 'progr'
            ? 'flex w-full flex-col items-center gap-1.5 border-l-2 border-teal bg-folha py-2.5 text-teal'
            : 'flex w-full flex-col items-center gap-1.5 py-2.5 text-faint'
        }
      >
        <span className="flex h-5 w-5 items-end gap-[2px]">
          <span className={`h-2 flex-1 ${active === 'progr' ? 'bg-teal' : 'bg-faint'}`} />
          <span className={`h-3.5 flex-1 ${active === 'progr' ? 'bg-teal' : 'bg-faint'}`} />
          <span className={`h-5 flex-1 ${active === 'progr' ? 'bg-teal' : 'bg-faint'}`} />
        </span>
        <span className="font-cifra text-[8px] uppercase tracking-wide">progresso</span>
      </div>

      <form action={logout} className="mt-auto flex w-full flex-col items-center">
        <button
          type="submit"
          className="flex w-full flex-col items-center gap-1.5 py-2.5 text-faint"
        >
          <span className="h-5 w-5 rounded-[3px] border-[1.5px] border-faint" />
          <span className="font-cifra text-[8px] uppercase tracking-wide">sair</span>
        </button>
      </form>
    </nav>
  )
}
