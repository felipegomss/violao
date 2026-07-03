import Link from 'next/link'
import { Guitar, Library, ListMusic, LogOut, type LucideIcon } from 'lucide-react'
import { logout } from '@/app/actions/auth'

type ActiveSection = 'acervo' | 'repert'

function SideLink({
  href,
  label,
  active,
  Icon,
}: {
  href: string
  label: string
  active: boolean
  Icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full flex-col items-center gap-1.5 py-2.5 transition-colors ${
        active ? 'border-l-2 border-teal bg-folha text-teal' : 'text-faint hover:text-ink'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2 : 1.75} />
      <span className="font-cifra text-[8px] uppercase tracking-wide">{label}</span>
    </Link>
  )
}

export function AppSidebar({ active }: { active: ActiveSection }) {
  return (
    <nav className="hidden min-h-screen w-[76px] flex-none flex-col items-center gap-1 border-r border-ink/12 bg-[#efe7d5] py-5 md:flex">
      <Link
        href="/songs"
        aria-label="Caderno de Violão — início"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-[11px] bg-ink text-folha transition-transform hover:-translate-y-0.5"
      >
        <Guitar size={21} strokeWidth={1.75} />
      </Link>

      <SideLink href="/songs" label="acervo" active={active === 'acervo'} Icon={Library} />
      <SideLink
        href="/repertorios"
        label="repertório"
        active={active === 'repert'}
        Icon={ListMusic}
      />

      <form action={logout} className="mt-auto flex w-full flex-col items-center">
        <button
          type="submit"
          className="flex w-full flex-col items-center gap-1.5 py-2.5 text-faint transition-colors hover:text-ink"
        >
          <LogOut size={20} strokeWidth={1.75} />
          <span className="font-cifra text-[8px] uppercase tracking-wide">sair</span>
        </button>
      </form>
    </nav>
  )
}
