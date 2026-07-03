'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Ellipsis, GripVertical, Plus, SquarePen, Trash2, X } from 'lucide-react'
import {
  reorderRepertoireSongs,
  removeSongFromRepertoire,
  addSongToRepertoire,
  renameRepertoire,
  deleteRepertoire,
} from '@/app/actions/repertoires'
import { Btn } from '@/components/btn'
import { EmptyState } from '@/components/empty-state'

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

type Row = {
  songId: string
  title: string
  artist: string
  key: string
  comoEstouTocando: number | null
  also: string[]
}
type Avail = {
  id: string
  title: string
  artist: string
  key: string
  comoEstouTocando: number | null
}

export function RepertorioDetalhe({
  repertoireId,
  name,
  rows,
  available,
}: {
  repertoireId: string
  name: string
  rows: Row[]
  available: Avail[]
}) {
  const [items, setItems] = useState<Row[]>(rows)
  const [avail, setAvail] = useState<Avail[]>(available)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [displayName, setDisplayName] = useState(name)
  const [q, setQ] = useState('')
  const itemsRef = useRef<Row[]>(rows)

  const setItemsTracked = (updater: (prev: Row[]) => Row[]) =>
    setItems((prev) => {
      const next = updater(prev)
      itemsRef.current = next
      return next
    })

  const move = (from: number, to: number) => {
    setItemsTracked((prev) => {
      const arr = [...prev]
      const [x] = arr.splice(from, 1)
      arr.splice(to, 0, x)
      return arr
    })
    setDragIndex(to)
  }

  const persistOrder = () => {
    void reorderRepertoireSongs(
      repertoireId,
      itemsRef.current.map((r) => r.songId),
    )
  }

  const remove = (songId: string) => {
    const row = items.find((r) => r.songId === songId)
    setItemsTracked((prev) => prev.filter((r) => r.songId !== songId))
    if (row)
      setAvail((prev) =>
        [
          ...prev,
          {
            id: row.songId,
            title: row.title,
            artist: row.artist,
            key: row.key,
            comoEstouTocando: row.comoEstouTocando,
          },
        ].sort((a, b) => a.title.localeCompare(b.title, 'pt')),
      )
    void removeSongFromRepertoire(repertoireId, songId)
  }

  const add = (s: Avail) => {
    setItemsTracked((prev) => [
      ...prev,
      {
        songId: s.id,
        title: s.title,
        artist: s.artist,
        key: s.key,
        comoEstouTocando: s.comoEstouTocando,
        also: [],
      },
    ])
    setAvail((prev) => prev.filter((a) => a.id !== s.id))
    void addSongToRepertoire(repertoireId, s.id)
  }

  const filteredAvail = avail.filter((a) =>
    (a.title + ' ' + a.artist).toLowerCase().includes(q.trim().toLowerCase()),
  )

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col">
      {/* header */}
      <div className="border-b border-ink/12 px-10 pt-6 pb-5">
        <Link
          href="/repertorios"
          className="inline-flex items-center gap-1 font-cifra text-[11px] text-faint hover:text-ink"
        >
          <ChevronLeft size={13} strokeWidth={2} />
          repertórios
        </Link>
        <div className="mt-2.5 flex items-end justify-between gap-6">
          <div>
            {renaming ? (
              <form
                action={renameRepertoire.bind(null, repertoireId)}
                onSubmit={(e) => {
                  const v = new FormData(e.currentTarget).get('name')
                  if (v) setDisplayName(String(v))
                  setRenaming(false)
                }}
              >
                <input
                  name="name"
                  defaultValue={displayName}
                  autoFocus
                  className="border-b border-ink/30 bg-transparent font-editorial text-[32px] font-semibold leading-none outline-none"
                />
              </form>
            ) : (
              <h2 className="font-editorial text-[32px] font-semibold leading-none">{displayName}</h2>
            )}
            <div className="mt-2 font-cifra text-[12px] lowercase text-faint">
              {items.length} músicas · arraste{' '}
              <GripVertical size={13} strokeWidth={2} className="inline-block align-middle text-teal" />{' '}
              pra reordenar
            </div>
          </div>
          <div className="relative flex gap-2.5">
            <Btn type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
              <Plus size={16} strokeWidth={2.25} /> Adicionar música
            </Btn>
            <Btn
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Ações do repertório"
            >
              <Ellipsis size={18} strokeWidth={2} />
            </Btn>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-40 rounded-lg border border-ink/20 bg-folha p-1.5 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
                <button
                  type="button"
                  onClick={() => {
                    setRenaming(true)
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left font-cifra text-[11px] hover:bg-[#f1eadb]"
                >
                  <SquarePen size={14} strokeWidth={2} />
                  renomear
                </button>
                <form action={deleteRepertoire.bind(null, repertoireId)}>
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm('Apagar este repertório? As músicas continuam no acervo.'))
                        e.preventDefault()
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left font-cifra text-[11px] text-rust hover:bg-[#f1eadb]"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                    apagar
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto px-10 pt-2.5 pb-11">
        {items.length === 0 ? (
          <EmptyState title="Repertório vazio. Adiciona umas músicas." />
        ) : (
          items.map((r, pos) => (
            <div
              key={r.songId}
              draggable
              onDragStart={() => setDragIndex(pos)}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragIndex != null && dragIndex !== pos) move(dragIndex, pos)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setDragIndex(null)
                persistOrder()
              }}
              onDragEnd={() => {
                setDragIndex(null)
                persistOrder()
              }}
              className={`flex items-center gap-4 border-b border-dotted border-ink/15 px-2.5 py-3 transition-colors duration-150 hover:bg-folha ${
                dragIndex === pos ? 'bg-[#efe7d5] opacity-40' : ''
              }`}
            >
              <span className="flex h-11 w-11 cursor-grab select-none items-center justify-center text-faint">
                <GripVertical size={16} strokeWidth={2} />
              </span>
              <span className="w-[26px] font-cifra text-[13px] text-faint">
                {String(pos + 1).padStart(2, '0')}
              </span>
              <Link
                href={`/songs/${r.songId}?palco=1&rep=${repertoireId}`}
                className="min-w-0 flex-1"
              >
                <div className="font-editorial text-[19px] font-semibold leading-tight">{r.title}</div>
                <div className="mt-0.5 flex items-center gap-2.5">
                  <span className="font-editorial text-[14px] italic text-soft">{r.artist}</span>
                  {r.also.length > 0 && (
                    <span className="font-cifra text-[11px] text-faint">
                      ↳ também em {r.also.join(', ')}
                    </span>
                  )}
                </div>
              </Link>
              <span className="font-cifra text-[13px] font-medium text-teal">
                {r.key}
              </span>
              <span className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-1.5 w-4 rounded-sm ${
                      n <= (r.comoEstouTocando ?? 0) ? 'bg-teal' : 'bg-ink/16'
                    }`}
                  />
                ))}
              </span>
              <button
                type="button"
                onClick={() => remove(r.songId)}
                aria-label="Remover do repertório"
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-faint transition-colors duration-150 hover:text-rust ${FOCUS}`}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* add picker */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-30 flex items-start justify-center bg-[rgba(22,19,15,.35)] p-8"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="mt-16 w-full max-w-md rounded-xl border border-ink/20 bg-folha p-5 shadow-[0_24px_50px_-20px_rgba(22,19,15,.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-baseline justify-between">
              <span className="font-cifra text-[11px] uppercase tracking-[.18em] text-ink">
                Adicionar música
              </span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                aria-label="Fechar"
                className={`-mr-3 -mt-2 flex h-11 w-11 items-center justify-center rounded-lg text-faint transition-colors duration-150 hover:text-ink ${FOCUS}`}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="buscar no acervo…"
              className={`h-11 w-full rounded-lg border border-ink/22 bg-[#fbf7ee] px-3 font-cifra text-[14px] outline-none transition-colors duration-150 focus:border-teal ${FOCUS}`}
            />
            <div className="mt-3 max-h-[320px] overflow-y-auto">
              {filteredAvail.length === 0 ? (
                <div className="py-8 text-center font-editorial text-[16px] italic text-faint">
                  Nada pra adicionar.
                </div>
              ) : (
                filteredAvail.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => add(s)}
                    className="flex w-full items-center justify-between gap-3 rounded px-2 py-2 text-left hover:bg-[#f1eadb]"
                  >
                    <span className="min-w-0">
                      <span className="font-editorial text-[16px] font-medium">{s.title}</span>{' '}
                      <span className="font-editorial text-[13px] italic text-soft">{s.artist}</span>
                    </span>
                    <span className="shrink-0 font-cifra text-[11px] font-medium text-teal">
                      {s.key}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
