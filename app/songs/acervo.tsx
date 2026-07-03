'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Search } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { searchSongs, type SongRow } from '@/app/actions/songs'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { useInfiniteSongs } from '@/lib/hooks/use-infinite-songs'
import { NewSongMenu } from './new-song-menu'

type SortKey = 'titulo' | 'artista' | 'toco'

const SORT_LABELS: Record<SortKey, string> = {
  titulo: 'Título A–Z',
  artista: 'Artista',
  toco: 'Como toco',
}

const PAGE = 40

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

export function Acervo({
  initialSongs,
  genres: facetGenres,
  artists: facetArtists,
  total,
  initialQ = '',
}: {
  initialSongs: SongRow[]
  genres: string[]
  artists: string[]
  total: number
  initialQ?: string
}) {
  const [q, setQ] = useState(initialQ)
  const [genre, setGenre] = useState('todos')
  const [artist, setArtist] = useState('todos')
  const [sort, setSort] = useState<SortKey>('titulo')
  const [artistOpen, setArtistOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const genres = ['todos', ...facetGenres]
  const artistOptions = ['todos', ...facetArtists]

  const anyMenuOpen = artistOpen || sortOpen
  const closeMenus = () => {
    setArtistOpen(false)
    setSortOpen(false)
  }

  const debouncedQ = useDebouncedValue(q, 250)
  const params = {
    q: debouncedQ.trim() || undefined,
    genre: genre === 'todos' ? undefined : genre,
    artist: artist === 'todos' ? undefined : artist,
    sort,
  }

  const listRef = useRef<HTMLDivElement>(null)
  const { items, loading, sentinelRef } = useInfiniteSongs({
    initialItems: initialSongs,
    params,
    pageSize: PAGE,
    fetchPage: (skip) => searchSongs({ ...params, skip, take: PAGE }),
    rootRef: listRef,
  })

  return (
    <div className="mx-auto flex h-full w-full min-w-0 max-w-7xl flex-col">
      {anyMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menus"
          className="fixed inset-0 z-10 cursor-default"
          onClick={closeMenus}
        />
      )}

      <div className="flex items-start justify-between gap-6 px-10 pt-8">
        <div>
          <h2 className="font-editorial text-[32px] font-semibold leading-none">Acervo</h2>
          {/* único eyebrow da tela */}
          <div className="mt-2 font-cifra text-[11px] uppercase tracking-[.18em] text-faint">
            {total} {total === 1 ? 'música' : 'músicas'}
          </div>
        </div>
        <NewSongMenu />
      </div>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-10 py-14">
          <EmptyState
            title="Seu acervo tá vazio. Bora adicionar a primeira música?"
            action={<NewSongMenu label="adicionar música" />}
          />
        </div>
      ) : (
        <>
          {/* Busca + filtros — ficam fixos; só a lista rola */}
          <div className="px-10 pt-8">
          {/* Search */}
          <div className="mb-2 flex items-center gap-3 border-b-[1.5px] border-ink/35 pb-2.5">
            <Search size={19} strokeWidth={2} className="shrink-0 text-faint" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título ou artista…"
              className="flex-1 border-0 bg-transparent font-editorial text-[20px] text-ink caret-teal outline-none placeholder:text-faint"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-x-4">
            <span className="font-cifra text-[11px] lowercase text-faint">gênero</span>
            <div className="flex flex-wrap gap-x-3">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`inline-flex h-11 items-center font-cifra text-[12px] lowercase transition-colors duration-150 ${FOCUS} ${
                    genre === g
                      ? 'text-teal underline underline-offset-4'
                      : 'text-soft hover:text-ink'
                  }`}
                >
                  {g === 'todos' ? 'Todos' : g}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Artista dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSortOpen(false)
                  setArtistOpen((v) => !v)
                }}
                className={`inline-flex h-11 items-center gap-1 font-cifra text-[12px] lowercase text-soft transition-colors duration-150 hover:text-ink ${FOCUS}`}
              >
                artista {artist === 'todos' ? 'todos' : artist}
                <ChevronDown size={14} strokeWidth={2} />
              </button>
              {artistOpen && (
                <div className="absolute right-0 z-20 mt-1.5 max-h-64 w-56 overflow-y-auto rounded-lg border border-ink/20 bg-folha p-1.5 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
                  {artistOptions.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setArtist(a)
                        setArtistOpen(false)
                      }}
                      className={`block w-full rounded px-2.5 py-2 text-left font-cifra text-[11px] ${
                        artist === a ? 'bg-teal/10 text-teal' : 'text-soft'
                      }`}
                    >
                      {a === 'todos' ? 'Todos' : a}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ordem dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setArtistOpen(false)
                  setSortOpen((v) => !v)
                }}
                className={`inline-flex h-11 items-center gap-1 font-cifra text-[12px] lowercase text-soft transition-colors duration-150 hover:text-ink ${FOCUS}`}
              >
                ordem {SORT_LABELS[sort]}
                <ChevronDown size={14} strokeWidth={2} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 z-20 mt-1.5 w-44 rounded-lg border border-ink/20 bg-folha p-1.5 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSort(s)
                        setSortOpen(false)
                      }}
                      className={`block w-full rounded px-2.5 py-2 text-left font-cifra text-[11px] ${
                        sort === s ? 'bg-teal/10 text-teal' : 'text-soft'
                      }`}
                    >
                      {SORT_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Lista — único trecho que rola */}
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-10 pb-10">
          {items.length === 0 && !loading ? (
            <EmptyState title="Nada por aqui. Tenta outra busca." />
          ) : (
            <div className="mt-2">
              {items.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/songs/${s.slug}`}
                  className="-mx-2 flex items-center gap-5 border-b border-dotted border-ink/15 px-2 py-3 transition-colors duration-150 hover:bg-folha"
                >
                  <span className="w-[34px] font-cifra text-[13px] text-faint">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-editorial text-[19px] font-semibold leading-tight">
                      {s.title}
                    </span>
                    <span className="block truncate font-editorial text-[14px] italic text-soft">
                      {s.artists.join(', ')}
                    </span>
                  </span>
                  <span className="w-10 text-right font-cifra text-[13px] font-medium text-teal">
                    {s.key}
                  </span>
                  <span className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`h-1.5 w-4 rounded-sm ${
                          n <= (s.comoEstouTocando ?? 0) ? 'bg-teal' : 'bg-ink/16'
                        }`}
                      />
                    ))}
                  </span>
                  <span className="w-[90px] truncate font-cifra text-[11px] text-faint">
                    {s.genres[0] ?? ''}
                  </span>
                </Link>
              ))}
              {/* sentinela do scroll infinito */}
              <div ref={sentinelRef} aria-hidden className="h-1" />
              {loading && (
                <div className="py-4 text-center font-cifra text-[11px] lowercase text-faint">
                  carregando…
                </div>
              )}
            </div>
          )}
          </div>
        </>
      )}
    </div>
  )
}
