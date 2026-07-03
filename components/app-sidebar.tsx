'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Library, ListMusic, LogOut, Search } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Semibreve } from '@/components/semibreve'
import { CompassoWordmark } from '@/components/compasso-wordmark'
import { logout } from '@/app/actions/auth'
import { searchSongs, type SongRow } from '@/app/actions/songs'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'

type Active = 'acervo' | 'repert'
export type SidebarContext = {
  currentSlug: string
  repSlug?: string
  repName?: string
  setlist?: { slug: string; title: string }[]
}

const HIDE_ICON = 'group-data-[collapsible=icon]:hidden'
// Alvo de 44px (DS): row alto expandido, botão 44×44 no modo ícone, ícone 20px.
const NAV_BTN =
  'h-11 gap-3 font-cifra text-[13px] lowercase group-data-[collapsible=icon]:size-11! [&_svg]:size-5'

export function AppSidebar({
  active,
  songs,
  context,
}: {
  active: Active
  songs: SongRow[]
  context?: SidebarContext
}) {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  // Busca no servidor (mostra 5; se >5, "ver mais" pro acervo).
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 250)
  const [items, setItems] = useState<SongRow[]>(songs)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    let alive = true
    void searchSongs({ q: debouncedQ.trim() || undefined, take: 6 }).then((rows) => {
      if (alive) setItems(rows)
    })
    return () => {
      alive = false
    }
  }, [debouncedQ])
  const shown = items.slice(0, 5)
  const hasMore = items.length > 5
  const moreHref = debouncedQ.trim() ? `/songs?q=${encodeURIComponent(debouncedQ.trim())}` : '/songs'
  const setlist = context?.setlist ?? []

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="gap-1">
        <div
          className={cn(
            'flex',
            collapsed ? 'flex-col items-center gap-1' : 'items-center justify-between px-1',
          )}
        >
          <Link href="/songs" aria-label="Compasso — início" className="flex items-center">
            {collapsed ? (
              <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-folha">
                <Semibreve size={20} />
              </span>
            ) : (
              <CompassoWordmark size={22} />
            )}
          </Link>
          <SidebarTrigger className="size-11 text-soft hover:text-ink" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navegação */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={NAV_BTN}
                isActive={active === 'acervo'}
                render={<Link href="/songs" />}
              >
                <Library />
                <span>acervo</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={NAV_BTN}
                isActive={active === 'repert'}
                render={<Link href="/repertorios" />}
              >
                <ListMusic />
                <span>repertórios</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Setlist do repertório (quando a música veio de um) */}
        {setlist.length > 0 && (
          <SidebarGroup className={HIDE_ICON}>
            <SidebarGroupLabel className="font-cifra lowercase">
              {context?.repName ?? 'repertório'}
            </SidebarGroupLabel>
            <SidebarMenu>
              {setlist.map((s, i) => (
                <SidebarMenuItem key={s.slug}>
                  <SidebarMenuButton
                    className="h-9"
                    isActive={s.slug === context?.currentSlug}
                    render={<Link href={`/songs/${s.slug}?rep=${context?.repSlug ?? ''}`} />}
                  >
                    <span className="w-5 shrink-0 font-cifra text-[11px] text-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate font-editorial text-[14px]">{s.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Busca + acervo (5 + ver mais) */}
        <SidebarGroup className={cn('min-h-0 flex-1', HIDE_ICON)}>
          <div className="mx-1 mb-2 flex items-center gap-2 border-b-[1.5px] border-ink/25 pb-2">
            <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="buscar música…"
              aria-label="Buscar música"
              className="w-full border-0 bg-transparent font-editorial text-[14px] text-ink caret-teal outline-none placeholder:text-faint"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {shown.length === 0 ? (
              <div className="px-2 py-5 text-center font-cifra text-[11px] lowercase text-faint">
                nada por aqui
              </div>
            ) : (
              <SidebarMenu>
                {shown.map((s) => (
                  <SidebarMenuItem key={s.slug}>
                    <SidebarMenuButton
                      className="h-auto py-2"
                      isActive={s.slug === context?.currentSlug}
                      render={<Link href={`/songs/${s.slug}`} />}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-editorial text-[14px] leading-tight">
                          {s.title}
                        </span>
                        {s.artists.length > 0 && (
                          <span className="block truncate font-cifra text-[11px] text-faint">
                            {s.artists.join(', ')}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-cifra text-[11px] font-medium text-faint">
                        {s.key}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {hasMore && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="h-9 justify-center text-teal"
                      render={<Link href={moreHref} />}
                    >
                      <span className="font-cifra text-[11px] lowercase">ver mais no acervo →</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            )}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton className={NAV_BTN} render={<button type="submit" />}>
                <LogOut />
                <span>sair</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
