'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'

type Song = {
  id: string
  slug: string
  title: string
  artists: string[]
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

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

// Espelho do <Btn variant="primary" size="md"> pra usar em <Link> (Btn é <button>).
const BTN_PRIMARY_LINK =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-transparent bg-teal px-5 font-cifra text-[13px] lowercase tracking-[.02em] text-folha transition-colors duration-150 hover:bg-[#16323f] focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

export function Acervo({ songs }: { songs: Song[] }) {
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState('todos')
  const [artist, setArtist] = useState('todos')
  const [sort, setSort] = useState<SortKey>('titulo')
  const [artistOpen, setArtistOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const genres = ['todos', ...Array.from(new Set(songs.flatMap((s) => s.genres)))]
  const artistOptions = ['todos', ...Array.from(new Set(songs.flatMap((s) => s.artists)))]

  const anyMenuOpen = artistOpen || sortOpen

  const closeMenus = () => {
    setArtistOpen(false)
    setSortOpen(false)
  }

  const needle = q.trim().toLowerCase()

  const filtered = songs
    .filter((s) => genre === 'todos' || s.genres.includes(genre))
    .filter((s) => artist === 'todos' || s.artists.includes(artist))
    .filter((s) => `${s.title} ${s.artists.join(' ')}`.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (sort === 'titulo') return a.title.localeCompare(b.title, 'pt')
      if (sort === 'artista')
        return (a.artists[0] ?? '').localeCompare(b.artists[0] ?? '', 'pt')
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
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col">
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
            {filtered.length} de {songs.length} músicas
          </div>
        </div>
        <Link href="/songs/new" className={BTN_PRIMARY_LINK}>
          <Plus size={16} strokeWidth={2.25} /> Nova música
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-10 py-14">
          <EmptyState
            title="Seu acervo tá vazio. Bora adicionar a primeira música?"
            action={
              <Link href="/songs/new" className={BTN_PRIMARY_LINK}>
                <Plus size={16} strokeWidth={2.25} /> adicionar música
              </Link>
            }
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto px-10 pb-10">
          {/* Search */}
          <div className="mb-2 mt-8 flex items-center gap-3 border-b-[1.5px] border-ink/35 pb-2.5">
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

          {/* List */}
          {filtered.length === 0 ? (
            <EmptyState title="Nada por aqui. Tenta outra busca." />
          ) : (
            <div className="mt-2">
              {filtered.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/songs/${s.slug}`}
                  style={{ animationDelay: `${Math.min(i, 5) * 40}ms`, animationDuration: '200ms' }}
                  className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both -mx-2 flex items-center gap-5 border-b border-dotted border-ink/15 px-2 py-3 transition-colors duration-150 hover:bg-folha"
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
