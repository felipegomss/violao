'use client'

import { useState } from 'react'
import Link from 'next/link'

type Song = {
  id: string
  title: string
  artist: string
  genres: string[]
  key: string
  comoEstouTocando: number | null
}

type SortKey = 'titulo' | 'artista' | 'toco'

const SORT_LABELS: Record<SortKey, string> = {
  titulo: 'Título A–Z',
  artista: 'Artista',
  toco: 'Como toco',
}

export function Acervo({ songs }: { songs: Song[] }) {
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState('todos')
  const [artist, setArtist] = useState('todos')
  const [sort, setSort] = useState<SortKey>('titulo')
  const [artistOpen, setArtistOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const genres = ['todos', ...Array.from(new Set(songs.flatMap((s) => s.genres)))]
  const artists = ['todos', ...Array.from(new Set(songs.map((s) => s.artist)))]

  const anyMenuOpen = artistOpen || sortOpen

  const closeMenus = () => {
    setArtistOpen(false)
    setSortOpen(false)
  }

  const needle = q.trim().toLowerCase()

  const filtered = songs
    .filter((s) => genre === 'todos' || s.genres.includes(genre))
    .filter((s) => artist === 'todos' || s.artist === artist)
    .filter((s) => `${s.title} ${s.artist}`.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (sort === 'titulo') return a.title.localeCompare(b.title, 'pt')
      if (sort === 'artista') return a.artist.localeCompare(b.artist, 'pt')
      // toco: desc, nulls last, tiebreak title
      const av = a.comoEstouTocando
      const bv = b.comoEstouTocando
      if (av == null && bv == null) return a.title.localeCompare(b.title, 'pt')
      if (av == null) return 1
      if (bv == null) return -1
      if (bv !== av) return bv - av
      return a.title.localeCompare(b.title, 'pt')
    })

  return (
    <div className="flex min-w-0 flex-1 flex-col">
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
          <h2 className="font-editorial text-[38px] font-medium leading-none">Acervo</h2>
          <div className="mt-2 font-cifra text-[12px] tracking-wide text-faint">
            {filtered.length} de {songs.length} músicas
          </div>
        </div>
        <Link
          href="/songs/new"
          className="flex items-center gap-2 rounded-lg bg-teal px-5 py-3 font-cifra text-[12px] uppercase tracking-[.14em] text-[#f0e9da]"
        >
          <span className="text-[16px] leading-none">+</span> Nova música
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10 py-14 text-center">
          <p className="font-editorial text-[20px] italic text-faint">
            Nenhuma música ainda — adicione a primeira.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto px-10 pb-10">
          {/* Search */}
          <div className="mt-6 flex items-center gap-3 border-b-[1.5px] border-ink/35 pb-2.5">
            <span className="font-editorial text-[20px] text-faint">⌕</span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título ou artista…"
              className="flex-1 border-0 bg-transparent font-editorial text-[20px] text-ink outline-none placeholder:text-faint"
            />
          </div>

          {/* Filter row */}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="font-cifra text-[10px] uppercase tracking-wide text-faint">
              gênero
            </span>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`rounded-md px-2.5 py-1.5 font-cifra text-[11px] ${
                    genre === g ? 'bg-teal text-folha' : 'border border-ink/22 text-soft'
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
                className="rounded-md border border-ink/22 px-3 py-1.5 font-cifra text-[11px] uppercase tracking-wide text-soft"
              >
                artista {artist === 'todos' ? 'todos' : artist} ▾
              </button>
              {artistOpen && (
                <div className="absolute right-0 z-20 mt-1.5 max-h-64 w-56 overflow-y-auto rounded-lg border border-ink/20 bg-folha p-1.5 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
                  {artists.map((a) => (
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
                className="rounded-md border border-ink/22 px-3 py-1.5 font-cifra text-[11px] uppercase tracking-wide text-soft"
              >
                ordem {SORT_LABELS[sort]} ▾
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

          {/* Column header */}
          <div className="mt-5 flex items-center gap-5 border-b border-ink/16 pb-2 font-cifra text-[9px] uppercase tracking-wide text-[#a89e8d]">
            <span className="w-[34px]">#</span>
            <span className="flex-1">música</span>
            <span className="w-[110px]">gênero</span>
            <span className="w-[56px] text-center">tom</span>
            <span className="w-[130px]">como toco</span>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-14 text-center">
              <p className="font-editorial text-[20px] italic text-faint">
                Nada encontrado — tente outra busca.
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/songs/${s.id}`}
                  className="-mx-2 flex items-center gap-5 rounded border-b border-ink/10 px-2 py-[15px] hover:bg-[#f1eadb]"
                >
                  <span className="w-[34px] font-cifra text-[13px] text-[#b0a696]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-editorial text-[23px] font-medium leading-tight">
                      {s.title}
                    </span>
                    <span className="block truncate font-editorial text-[16px] italic text-[#7a7061]">
                      {s.artist}
                    </span>
                  </span>
                  <span className="w-[110px]">
                    {s.genres[0] && (
                      <span className="inline-block rounded border border-ink/24 px-2 py-0.5 font-cifra text-[10px] uppercase text-soft">
                        {s.genres[0]}
                      </span>
                    )}
                  </span>
                  <span className="w-[56px] text-center">
                    <span className="rounded bg-teal px-2.5 py-1 font-cifra text-[13px] font-medium text-folha">
                      {s.key}
                    </span>
                  </span>
                  <span className="flex w-[130px] gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`h-[9px] w-[18px] rounded-[1px] ${
                          n <= (s.comoEstouTocando ?? 0) ? 'bg-teal' : 'bg-ink/16'
                        }`}
                      />
                    ))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
