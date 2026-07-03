'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Library,
  ListMusic,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Semibreve } from '@/components/semibreve'
import { logout } from '@/app/actions/auth'
import { searchSongs, type SongRow } from '@/app/actions/songs'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { useInfiniteSongs } from '@/lib/hooks/use-infinite-songs'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

type Active = 'acervo' | 'repert'
export type SidebarContext = {
  currentSlug: string
  repSlug?: string
  repName?: string
  setlist?: { slug: string; title: string }[]
}

// Ícone+label vertical do rail recolhido (paridade com a sidebar antiga).
function RailLink({
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
      <span className="font-cifra text-[11px] lowercase">{label}</span>
    </Link>
  )
}

function CollapsedRail({ active, onExpand }: { active: Active; onExpand: () => void }) {
  return (
    <div className="flex h-full flex-col items-center gap-1 py-5">
      <Link
        href="/songs"
        aria-label="Compasso — início"
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-folha transition-transform duration-150 hover:-translate-y-0.5"
      >
        <Semibreve size={24} />
      </Link>
      <RailLink href="/songs" label="acervo" active={active === 'acervo'} Icon={Library} />
      <RailLink href="/repertorios" label="repertório" active={active === 'repert'} Icon={ListMusic} />

      {/* rodapé: expandir + sair */}
      <div className="mt-auto flex w-full flex-col items-center gap-1">
        <button
          type="button"
          aria-label="Expandir menu"
          onClick={onExpand}
          className={`flex w-full flex-col items-center gap-1.5 py-2.5 text-faint transition-colors duration-150 hover:text-ink ${FOCUS}`}
        >
          <PanelLeft size={20} strokeWidth={1.75} />
          <span className="font-cifra text-[11px] lowercase">expandir</span>
        </button>
        <form action={logout} className="flex w-full flex-col items-center">
          <button
            type="submit"
            className="flex w-full flex-col items-center gap-1.5 py-2.5 text-faint transition-colors duration-150 hover:text-ink"
          >
            <LogOut size={20} strokeWidth={1.75} />
            <span className="font-cifra text-[11px] lowercase">sair</span>
          </button>
        </form>
      </div>
    </div>
  )
}

// Link de seção do painel expandido (horizontal, ícone + label).
function PanelNavLink({
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
      className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors duration-150 ${
        active ? 'bg-folha text-teal' : 'text-soft hover:bg-folha hover:text-ink'
      } ${FOCUS}`}
    >
      <Icon size={18} strokeWidth={active ? 2 : 1.75} />
      <span className="font-cifra text-[13px] lowercase">{label}</span>
    </Link>
  )
}

// Conteúdo do painel expandido — reutilizado no desktop expandido e no drawer mobile.
function Panel({
  active,
  songs,
  context,
  onClose,
  closeIcon,
}: {
  active: Active
  songs: SongRow[]
  context?: SidebarContext
  onClose: () => void
  closeIcon: 'collapse' | 'close'
}) {
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 250)
  const params = { q: debouncedQ.trim() || undefined }
  const listRef = useRef<HTMLDivElement>(null)
  const { items, loading, sentinelRef } = useInfiniteSongs({
    initialItems: songs,
    params,
    pageSize: 30,
    fetchPage: (skip) => searchSongs({ ...params, skip, take: 30 }),
    rootRef: listRef,
  })
  const setlist = context?.setlist ?? []

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header: logo + recolher/fechar */}
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <Link
          href="/songs"
          aria-label="Compasso — início"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-folha transition-transform duration-150 hover:-translate-y-0.5"
        >
          <Semibreve size={24} />
        </Link>
        <button
          type="button"
          aria-label={closeIcon === 'close' ? 'Fechar menu' : 'Recolher menu'}
          onClick={onClose}
          className={`flex h-11 w-11 items-center justify-center text-faint transition-colors duration-150 hover:text-ink ${FOCUS}`}
        >
          {closeIcon === 'close' ? (
            <X size={20} strokeWidth={1.75} />
          ) : (
            <PanelLeftClose size={20} strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Seções */}
      <div className="px-3">
        <PanelNavLink href="/songs" label="acervo" active={active === 'acervo'} Icon={Library} />
        <PanelNavLink
          href="/repertorios"
          label="repertórios"
          active={active === 'repert'}
          Icon={ListMusic}
        />
      </div>

      {/* Setlist do repertório (quando a música veio de um) */}
      {setlist.length > 0 && (
        <div className="mt-1 border-t border-dotted border-ink/15 px-4 pb-2 pt-3">
          <div className="mb-1.5 font-cifra text-[11px] lowercase text-faint">
            {context?.repName ?? 'repertório'}
          </div>
          <div className="flex max-h-[34vh] flex-col overflow-y-auto">
            {setlist.map((s, i) => {
              const cur = s.slug === context?.currentSlug
              return (
                <Link
                  key={s.slug}
                  href={`/songs/${s.slug}?rep=${context?.repSlug ?? ''}`}
                  aria-current={cur ? 'page' : undefined}
                  className={`flex items-center gap-3 border-l-2 py-1.5 pl-2.5 pr-1 transition-colors duration-150 ${
                    cur
                      ? 'border-teal text-teal'
                      : 'border-transparent text-soft hover:bg-folha hover:text-ink'
                  }`}
                >
                  <span className="w-6 shrink-0 font-cifra text-[11px] text-faint">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate font-editorial text-[15px] leading-tight">{s.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Busca + acervo */}
      <div className="mt-1 flex min-h-0 flex-1 flex-col border-t border-dotted border-ink/15 pt-3">
        <div className="mx-4 mb-1 flex items-center gap-2 border-b-[1.5px] border-ink/30 pb-1.5">
          <Search size={16} strokeWidth={2} className="shrink-0 text-faint" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="buscar música…"
            aria-label="Buscar música"
            className="w-full border-0 bg-transparent font-editorial text-[15px] text-ink caret-teal outline-none placeholder:text-faint"
          />
        </div>
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          {items.length === 0 && !loading ? (
            <div className="px-2 py-6 text-center font-cifra text-[11px] lowercase text-faint">
              nada por aqui
            </div>
          ) : (
            <>
              {items.map((s) => {
                const cur = context?.currentSlug === s.slug
                return (
                  <Link
                    key={s.slug}
                    href={`/songs/${s.slug}`}
                    aria-current={cur ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-150 ${
                      cur ? 'bg-folha' : 'hover:bg-folha'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate font-editorial text-[15px] leading-tight ${
                          cur ? 'text-teal' : 'text-ink'
                        }`}
                      >
                        {s.title}
                      </span>
                      {s.artists.length > 0 && (
                        <span className="block truncate font-cifra text-[11px] text-faint">
                          {s.artists.join(', ')}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-cifra text-[11px] font-medium text-faint">{s.key}</span>
                  </Link>
                )
              })}
              <div ref={sentinelRef} aria-hidden className="h-1" />
              {loading && (
                <div className="px-2 py-3 text-center font-cifra text-[11px] lowercase text-faint">
                  carregando…
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rodapé: sair */}
      <form action={logout} className="border-t border-dotted border-ink/15 px-3 py-2">
        <button
          type="submit"
          className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-faint transition-colors duration-150 hover:bg-folha hover:text-ink ${FOCUS}`}
        >
          <LogOut size={18} strokeWidth={1.75} />
          <span className="font-cifra text-[13px] lowercase">sair</span>
        </button>
      </form>
    </div>
  )
}

export function SidebarShell({
  initialExpanded,
  active,
  songs,
  context,
}: {
  initialExpanded: boolean
  active: Active
  songs: SongRow[]
  context?: SidebarContext
}) {
  const [expanded, setExpanded] = useState(initialExpanded)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    document.cookie = `sidebar=${next ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`
  }

  // Fecha o drawer ao trocar de rota.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Drawer aberto: trava o scroll do body e ESC fecha.
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen])

  return (
    <>
      {/* Desktop: rail que anima a largura entre recolhido e expandido */}
      <nav
        className={`sticky top-0 hidden h-screen flex-none flex-col self-start overflow-hidden border-r border-ink/12 bg-[#efe7d5] transition-[width] duration-[250ms] ease-out motion-reduce:transition-none md:flex ${
          expanded ? 'w-[300px]' : 'w-[76px]'
        }`}
      >
        {expanded ? (
          <Panel
            active={active}
            songs={songs}
            context={context}
            onClose={toggle}
            closeIcon="collapse"
          />
        ) : (
          <CollapsedRail active={active} onExpand={toggle} />
        )}
      </nav>

      {/* Mobile: topbar fina com botão de menu */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-ink/12 bg-[#efe7d5] px-2 md:hidden">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setDrawerOpen(true)}
          className={`flex h-11 w-11 items-center justify-center text-ink ${FOCUS}`}
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
        <Link
          href="/songs"
          aria-label="Compasso — início"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-folha"
        >
          <Semibreve size={20} />
        </Link>
      </div>

      {/* Mobile: drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-[rgba(22,19,15,.4)]"
          />
          <nav className="absolute inset-y-0 left-0 flex w-[300px] flex-col border-r border-ink/12 bg-[#efe7d5]">
            <Panel
              active={active}
              songs={songs}
              context={context}
              onClose={() => setDrawerOpen(false)}
              closeIcon="close"
            />
          </nav>
        </div>
      )}
    </>
  )
}
