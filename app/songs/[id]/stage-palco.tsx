'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListMusic, Presentation, SkipBack, SkipForward } from 'lucide-react'
import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { transposeChord, degreeChord } from '@/lib/chords/transform'
import { suggestScrollSpeed } from '@/lib/song/autoscroll'

type Notation = 'chord' | 'degree'

function renderDark(sheet: ChordSheetModel, disp: (c: string) => string) {
  return sheet.lines.map((line, i) => {
    if (line.type === 'empty') return <div key={i} className="h-4" aria-hidden />
    if (line.type === 'label')
      return (
        <div
          key={i}
          className="mt-7 mb-2 font-cifra text-[11px] uppercase tracking-[.2em] text-gold/70 first:mt-0"
        >
          {line.text}
        </div>
      )
    if (line.type === 'tab')
      return (
        <pre
          key={i}
          className="my-3 w-fit max-w-full overflow-x-auto rounded-md border border-[#f0e9da]/12 bg-[#100e0b] px-4 py-3 font-cifra text-[15px] leading-[1.5] text-[#f0e9da]"
        >
          {line.lines.join('\n')}
        </pre>
      )
    const chordOnly = line.items.every((it) => it.lyrics.trim() === '')
    if (chordOnly)
      return (
        <div key={i} className="my-2 flex flex-wrap gap-5 font-cifra text-[18px] font-bold text-gold">
          {line.items.map((it, j) => (
            <span key={j}>{it.chord ? disp(it.chord) : ''}</span>
          ))}
        </div>
      )
    return (
      <div key={i} className="flex flex-wrap items-end">
        {line.items.map((it, j) => {
          return (
            <span key={j} className="inline-flex flex-col items-start">
              <span
                className={`h-[20px] font-cifra text-[16px] font-bold leading-none text-gold${
                  it.chord ? ' pr-3' : ''
                }`}
              >
                {it.chord ? disp(it.chord) : ' '}
              </span>
              <span className="whitespace-pre font-cifra text-[20px] leading-[1.55] text-[#f0e9da]">
                {it.lyrics || ' '}
              </span>
            </span>
          )
        })}
      </div>
    )
  })
}

export function StagePalco({
  sheet,
  title,
  songKey,
  bpm,
  currentId,
  playlist = [],
  repertoireId,
  autoOpen = false,
}: {
  sheet: ChordSheetModel | null
  title: string
  songKey: string
  bpm: number | null
  currentId: string
  playlist?: { id: string; title: string }[]
  repertoireId?: string
  autoOpen?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(autoOpen)
  const [listOpen, setListOpen] = useState(false)

  // Playlist (só quando o palco veio de um repertório). idx = posição atual.
  const idx = playlist.findIndex((p) => p.id === currentId)
  const hasList = playlist.length > 1 && idx >= 0
  const prev = hasList && idx > 0 ? playlist[idx - 1] : null
  const next = hasList && idx < playlist.length - 1 ? playlist[idx + 1] : null
  const goTo = (id: string) =>
    router.push(`/songs/${id}?palco=1${repertoireId ? `&rep=${repertoireId}` : ''}`)
  const [notation, setNotation] = useState<Notation>('chord')
  const [transpose, setTranspose] = useState(0)
  const [autoScroll, setAutoScroll] = useState(false)
  const [pxPerSec, setPxPerSec] = useState(16)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Ao abrir o palco, mede o container e sugere a velocidade pela BPM.
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    const rows = sheet ? sheet.lines.filter((l) => l.type === 'row').length : 0
    const scrollable = el.scrollHeight - el.clientHeight
    setPxPerSec(suggestScrollSpeed({ scrollable, rows, bpm }))
  }, [open, sheet, bpm])

  // Auto-scroll do palco — baseado em TEMPO (px/s), independente do monitor.
  useEffect(() => {
    if (!open || !autoScroll) return
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    let last = 0
    let carry = 0
    const tick = (ts: number) => {
      if (!last) last = ts
      const dt = Math.min(0.05, (ts - last) / 1000)
      last = ts
      carry += pxPerSec * dt
      const px = Math.floor(carry)
      if (px > 0) {
        el.scrollTop += px
        carry -= px
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        setAutoScroll(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, autoScroll, pxPerSec])

  // Teclado: Esc sai; ←/→ navegam a playlist (quando veio de um repertório).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (listOpen) setListOpen(false)
        else setOpen(false)
      } else if (e.key === 'ArrowRight' && next) goTo(next.id)
      else if (e.key === 'ArrowLeft' && prev) goTo(prev.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listOpen, next, prev])

  const disp = (c: string) =>
    notation === 'degree' ? degreeChord(c, songKey) : transposeChord(c, transpose)
  const keyLabel = notation === 'degree' ? 'GRAUS' : transposeChord(songKey, transpose)
  const transposeLabel =
    notation === 'degree'
      ? 'graus'
      : `${transpose > 0 ? '+' : ''}${transpose} · ${transposeChord(songKey, transpose)}`

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 font-cifra text-[11px] uppercase tracking-wide text-folha"
      >
        <Presentation size={15} strokeWidth={2} />
        modo palco
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-palco">
          {/* topo */}
          <div className="flex items-center justify-between gap-4 border-b border-[#f0e9da]/10 px-6 py-4 md:px-8">
            <div className="min-w-0">
              <div className="truncate font-editorial text-2xl font-medium text-[#f0e9da]">{title}</div>
              <div className="font-cifra text-[11px] tracking-[.1em] text-stageblue">
                TOM {keyLabel}
                {bpm ? ` · ${bpm} BPM` : ''}
                {hasList ? ' · repertório' : ''}
              </div>
            </div>

            <div className="flex flex-none items-center gap-3">
              {hasList && (
                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => prev && goTo(prev.id)}
                    disabled={!prev}
                    aria-label="Música anterior"
                    title={prev ? prev.title : undefined}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-[#f0e9da]/25 text-[#f0e9da] transition disabled:opacity-30"
                  >
                    <SkipBack size={16} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setListOpen((o) => !o)}
                    aria-label="Ver repertório"
                    className="flex min-w-[68px] items-center justify-center gap-1.5 rounded-md border border-[#f0e9da]/25 px-2 py-2 font-cifra text-[11px] tracking-[.08em] tabular-nums text-[#f0e9da]/80 transition hover:text-[#f0e9da]"
                  >
                    <ListMusic size={14} strokeWidth={2} />
                    {idx + 1} / {playlist.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => next && goTo(next.id)}
                    disabled={!next}
                    aria-label="Próxima música"
                    title={next ? next.title : undefined}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-[#f0e9da]/25 text-[#f0e9da] transition disabled:opacity-30"
                  >
                    <SkipForward size={16} strokeWidth={2} />
                  </button>

                  {listOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="Fechar repertório"
                        onClick={() => setListOpen(false)}
                        className="fixed inset-0 z-10 cursor-default"
                      />
                      <div className="absolute right-0 top-[calc(100%+8px)] z-20 max-h-[62vh] w-72 overflow-y-auto rounded-lg border border-[#f0e9da]/15 bg-[#1a1712] p-1.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,.7)]">
                        {playlist.map((p, i) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setListOpen(false)
                              if (p.id !== currentId) goTo(p.id)
                            }}
                            className={`flex w-full items-center gap-3 rounded px-2.5 py-2 text-left transition-colors ${
                              p.id === currentId
                                ? 'bg-gold/15 text-gold'
                                : 'text-[#f0e9da]/80 hover:bg-[#f0e9da]/10'
                            }`}
                          >
                            <span className="w-5 font-cifra text-[11px] tabular-nums text-[#f0e9da]/40">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-editorial text-[15px]">
                              {p.title}
                            </span>
                            {p.id === currentId && (
                              <span className="flex-none font-cifra text-[8px] uppercase tracking-[.12em]">
                                tocando
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-gold px-4 py-2.5 font-cifra text-[11px] uppercase tracking-wide text-palco"
              >
                sair do palco
              </button>
            </div>
          </div>

          {/* corpo */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 md:px-16">
            <div className="mx-auto max-w-3xl">
              {sheet ? (
                renderDark(sheet, disp)
              ) : (
                <div className="font-editorial text-[22px] italic text-[#f0e9da]/60">
                  cifra não disponível.
                </div>
              )}
            </div>
          </div>

          {/* controles */}
          <div className="flex flex-wrap items-center justify-center gap-5 border-t border-[#f0e9da]/10 bg-[#100e0b] px-6 py-4">
            <div className="flex overflow-hidden rounded-md border border-[#f0e9da]/25">
              <button
                type="button"
                onClick={() => setNotation('chord')}
                className={`px-3.5 py-2 font-cifra text-[11px] ${
                  notation === 'chord' ? 'bg-gold text-palco' : 'text-[#f0e9da]'
                }`}
              >
                Acorde
              </button>
              <button
                type="button"
                onClick={() => setNotation('degree')}
                className={`px-3.5 py-2 font-cifra text-[11px] ${
                  notation === 'degree' ? 'bg-gold text-palco' : 'text-[#f0e9da]'
                }`}
              >
                Grau
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTranspose((t) => Math.max(-6, t - 1))}
                disabled={notation === 'degree'}
                className="h-10 w-10 rounded-lg border border-[#f0e9da]/25 font-cifra text-lg text-[#f0e9da] disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-[72px] text-center font-cifra text-[13px] text-stageblue">
                {transposeLabel}
              </span>
              <button
                type="button"
                onClick={() => setTranspose((t) => Math.min(6, t + 1))}
                disabled={notation === 'degree'}
                className="h-10 w-10 rounded-lg border border-[#f0e9da]/25 font-cifra text-lg text-[#f0e9da] disabled:opacity-40"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAutoScroll((v) => !v)}
                title="auto-scroll"
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  autoScroll ? 'bg-stageblue' : 'bg-gold'
                }`}
              >
                {autoScroll ? (
                  <span className="flex gap-1">
                    <span className="h-4 w-1 bg-palco" />
                    <span className="h-4 w-1 bg-palco" />
                  </span>
                ) : (
                  <span className="ml-1 h-0 w-0 border-y-[10px] border-l-[15px] border-y-transparent border-l-palco" />
                )}
              </button>
              <input
                type="range"
                min={4}
                max={80}
                step={1}
                value={pxPerSec}
                onChange={(e) => setPxPerSec(Number(e.target.value))}
                className="w-24"
                aria-label="velocidade do auto-scroll"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
