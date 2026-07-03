import Link from 'next/link'
import { Library, ListMusic, LogOut, type LucideIcon } from 'lucide-react'
import { logout } from '@/app/actions/auth'

type ActiveSection = 'acervo' | 'repert'

// Marca do Compasso: uma semibreve (nota inteira) — furo inclinado clássico.
function Semibreve({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <mask id="sidebar-semibreve-hole">
        <rect width="40" height="40" fill="#fff" />
        <ellipse cx="20" cy="20" rx="7.9" ry="3.1" transform="rotate(-28 20 20)" fill="#000" />
      </mask>
      <ellipse
        cx="20"
        cy="20"
        rx="12"
        ry="8.4"
        fill="currentColor"
        mask="url(#sidebar-semibreve-hole)"
      />
    </svg>
  )
}

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
    <nav className="sticky top-0 hidden h-screen w-[76px] flex-none flex-col items-center gap-1 self-start overflow-y-auto border-r border-ink/12 bg-[#efe7d5] py-5 md:flex">
      <Link
        href="/songs"
        aria-label="Compasso — início"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-[11px] bg-ink text-folha transition-transform hover:-translate-y-0.5"
      >
        <Semibreve size={22} />
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
