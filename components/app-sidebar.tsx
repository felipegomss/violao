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

  // Busca no servidor (mesma lógica: mostra 5; se >5, "ver mais" pro acervo).
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          className={cn(
            'flex px-1',
            collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between',
          )}
        >
          <Link href="/songs" aria-label="Compasso — início" className="flex items-center">
            {collapsed ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-folha">
                <Semibreve size={18} />
              </span>
            ) : (
              <CompassoWordmark size={22} />
            )}
          </Link>
          <SidebarTrigger className="text-soft hover:text-ink" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navegação */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={active === 'acervo'} render={<Link href="/songs" />}>
                <Library />
                <span className="font-cifra text-[13px] lowercase">acervo</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={active === 'repert'} render={<Link href="/repertorios" />}>
                <ListMusic />
                <span className="font-cifra text-[13px] lowercase">repertórios</span>
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
          <div className="mx-1 mb-1 flex items-center gap-2 border-b-[1.5px] border-ink/30 pb-1.5">
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
                      className="h-auto"
                      isActive={s.slug === context?.currentSlug}
                      render={<Link href={`/songs/${s.slug}`} />}
                    >
                      <span className="min-w-0 flex-1 py-0.5">
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
                      className="justify-center text-teal"
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
              <SidebarMenuButton render={<button type="submit" />}>
                <LogOut />
                <span className="font-cifra text-[13px] lowercase">sair</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
