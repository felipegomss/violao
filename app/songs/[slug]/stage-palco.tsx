'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListMusic, Pause, Play, Presentation, SkipBack, SkipForward } from 'lucide-react'
import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { transposeChord, degreeChord } from '@/lib/chords/transform'
import { suggestScrollSpeed } from '@/lib/song/autoscroll'
import { sectionKeys } from '@/lib/song/sections'
import { Btn } from '@/components/btn'
import { StagePlayer } from './stage-player'

type Notation = 'chord' | 'degree'

// Foco no palco usa gold (teal não tem contraste no fundo escuro).
const FOCUS_PALCO =
  'focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2'

function renderDark(sheet: ChordSheetModel, disp: (c: string) => string) {
  const keys = sectionKeys(sheet.lines)
  return sheet.lines.map((line, i) => {
    if (line.type === 'empty') return <div key={i} className="h-4" aria-hidden />
    if (line.type === 'label') {
      const k = keys[i]
      return (
        <div
          key={i}
          data-section-key={k}
          className="mt-8 mb-3 flex items-center gap-2 border-l-2 border-gold/40 pl-2.5 font-cifra text-[12px] uppercase tracking-[.08em] text-gold/70 first:mt-0"
        >
          {k && (
            <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-gold/40 px-1 text-[10px] font-medium normal-case text-gold">
              {k}
            </kbd>
          )}
          <span>{line.text}</span>
        </div>
      )
    }
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
              <span className="whitespace-pre font-cifra text-[22px] leading-[1.8] text-[#f0e9da]">
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
  currentSlug,
  playlist = [],
  repertoireSlug,
  referenceYoutubeUrl,
  autoOpen = false,
}: {
  sheet: ChordSheetModel | null
  title: string
  songKey: string
  bpm: number | null
  currentSlug: string
  playlist?: { slug: string; title: string }[]
  repertoireSlug?: string
  referenceYoutubeUrl?: string | null
  autoOpen?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(autoOpen)
  const [listOpen, setListOpen] = useState(false)

  // Playlist (só quando o palco veio de um repertório). idx = posição atual.
  const idx = playlist.findIndex((p) => p.slug === currentSlug)
  const hasList = playlist.length > 1 && idx >= 0
  const prev = hasList && idx > 0 ? playlist[idx - 1] : null
  const next = hasList && idx < playlist.length - 1 ? playlist[idx + 1] : null
  const goTo = (slug: string) =>
    router.push(`/songs/${slug}?palco=1${repertoireSlug ? `&rep=${repertoireSlug}` : ''}`)
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

  // Trava o scroll da página de trás enquanto o palco está aberto — sem isso
  // ficam DOIS scrolls (o do body e o do corpo do palco), e o auto-scroll da
  // folha (window.scrollBy) segue rolando invisível por baixo do overlay.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Teclado: Esc sai; ←/→ navegam a playlist (quando veio de um repertório).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (listOpen) setListOpen(false)
        else setOpen(false)
      } else if (e.key === 'ArrowRight' && next) goTo(next.slug)
      else if (e.key === 'ArrowLeft' && prev) goTo(prev.slug)
      else if (/^[1-9]$/.test(e.key) || e.key === 'r' || e.key === 'R') {
        // hotkey de seção: 1-9 pras partes, R pro refrão — rola o corpo do palco
        const key = e.key === 'r' || e.key === 'R' ? 'R' : e.key
        const root = scrollRef.current
        const el = root?.querySelector<HTMLElement>(`[data-section-key="${key}"]`)
        if (root && el) {
          e.preventDefault()
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          // auto-scroll ligado engole o scroll suave → salto instantâneo
          const behavior: ScrollBehavior = autoScroll || reduce ? 'auto' : 'smooth'
          const top =
            el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 24
          root.scrollTo({ top: Math.max(0, top), behavior })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listOpen, next, prev, autoScroll])

  const disp = (c: string) =>
    notation === 'degree' ? degreeChord(c, songKey) : transposeChord(c, transpose)
  const keyLabel = notation === 'degree' ? 'GRAUS' : transposeChord(songKey, transpose)
  const transposeLabel =
    notation === 'degree'
      ? 'graus'
      : `${transpose > 0 ? '+' : ''}${transpose} · ${transposeChord(songKey, transpose)}`

  return (
    <>
      <Btn variant="secondary" onClick={() => setOpen(true)}>
        <Presentation size={16} strokeWidth={2} />
        modo palco
      </Btn>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-palco animate-in fade-in zoom-in-[.98] duration-250 ease-out">
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
                    onClick={() => prev && goTo(prev.slug)}
                    disabled={!prev}
                    aria-label="Música anterior"
                    title={prev ? prev.title : undefined}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border border-[#f0e9da]/25 text-[#f0e9da] transition-colors duration-150 ease-out disabled:opacity-30 ${FOCUS_PALCO}`}
                  >
                    <SkipBack size={16} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setListOpen((o) => !o)}
                    aria-label="Ver repertório"
                    className={`flex h-11 min-w-[68px] items-center justify-center gap-1.5 rounded-lg border border-[#f0e9da]/25 px-2 font-cifra text-[11px] tracking-[.08em] tabular-nums text-[#f0e9da]/80 transition-colors duration-150 ease-out hover:text-[#f0e9da] ${FOCUS_PALCO}`}
                  >
                    <ListMusic size={14} strokeWidth={2} />
                    {idx + 1} / {playlist.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => next && goTo(next.slug)}
                    disabled={!next}
                    aria-label="Próxima música"
                    title={next ? next.title : undefined}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border border-[#f0e9da]/25 text-[#f0e9da] transition-colors duration-150 ease-out disabled:opacity-30 ${FOCUS_PALCO}`}
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
                            key={p.slug}
                            type="button"
                            onClick={() => {
                              setListOpen(false)
                              if (p.slug !== currentSlug) goTo(p.slug)
                            }}
                            className={`flex w-full items-center gap-3 rounded px-2.5 py-2 text-left transition-colors ${
                              p.slug === currentSlug
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
                            {p.slug === currentSlug && (
                              <span className="flex-none font-cifra text-[11px] lowercase">
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
                className={`h-11 rounded-lg bg-gold px-5 font-cifra text-[13px] lowercase text-palco transition-colors duration-150 ease-out hover:bg-gold/90 ${FOCUS_PALCO}`}
              >
                sair do palco
              </button>
            </div>
          </div>

          {/* corpo */}
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-8 md:px-16"
          >
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

          {/* controles — mesma ordem da régua de estudo: transpor · notação · scroll */}
          <div className="flex flex-wrap items-center justify-center gap-6 border-t border-[#f0e9da]/10 bg-[#100e0b] px-6 py-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTranspose((t) => Math.max(-6, t - 1))}
                disabled={notation === 'degree'}
                aria-label="descer meio tom"
                className={`h-11 w-11 rounded-lg border border-[#f0e9da]/25 font-cifra text-lg text-[#f0e9da] transition-colors duration-150 ease-out disabled:opacity-40 ${FOCUS_PALCO}`}
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
                aria-label="subir meio tom"
                className={`h-11 w-11 rounded-lg border border-[#f0e9da]/25 font-cifra text-lg text-[#f0e9da] transition-colors duration-150 ease-out disabled:opacity-40 ${FOCUS_PALCO}`}
              >
                +
              </button>
            </div>

            <div className="flex overflow-hidden rounded-lg border border-[#f0e9da]/25">
              <button
                type="button"
                onClick={() => setNotation('chord')}
                className={`h-11 px-4 font-cifra text-[11px] lowercase transition-colors duration-150 ease-out ${FOCUS_PALCO} ${
                  notation === 'chord' ? 'bg-gold text-palco' : 'text-[#f0e9da]'
                }`}
              >
                acorde
              </button>
              <button
                type="button"
                onClick={() => setNotation('degree')}
                className={`h-11 px-4 font-cifra text-[11px] lowercase transition-colors duration-150 ease-out ${FOCUS_PALCO} ${
                  notation === 'degree' ? 'bg-gold text-palco' : 'text-[#f0e9da]'
                }`}
              >
                grau
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAutoScroll((v) => !v)}
                title="auto-scroll"
                aria-label={autoScroll ? 'pausar rolagem automática' : 'iniciar rolagem automática'}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-palco transition-colors duration-150 ease-out ${FOCUS_PALCO} ${
                  autoScroll ? 'bg-stageblue' : 'bg-gold'
                }`}
              >
                {autoScroll ? (
                  <Pause size={20} strokeWidth={2} fill="currentColor" />
                ) : (
                  <Play size={20} strokeWidth={2} fill="currentColor" className="ml-0.5" />
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

            {/* áudio de referência — play · pause · recomeçar */}
            {referenceYoutubeUrl && (
              <>
                <span aria-hidden className="h-8 w-px bg-[#f0e9da]/10 max-md:hidden" />
                <StagePlayer url={referenceYoutubeUrl} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
