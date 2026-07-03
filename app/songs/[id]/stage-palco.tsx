'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { transposeChord, degreeChord } from '@/lib/chords/transform'

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
        {line.items.map((it, j) => (
          <span key={j} className="inline-flex flex-col items-start">
            <span className="h-[20px] font-cifra text-[16px] font-bold leading-none text-gold">
              {it.chord ? disp(it.chord) : ' '}
            </span>
            <span className="whitespace-pre font-editorial text-[28px] leading-[1.3] text-[#f0e9da]">
              {it.lyrics}
            </span>
          </span>
        ))}
      </div>
    )
  })
}

export function StagePalco({
  sheet,
  title,
  songKey,
  bpm,
}: {
  sheet: ChordSheetModel | null
  title: string
  songKey: string
  bpm: number | null
}) {
  const [open, setOpen] = useState(false)
  const [notation, setNotation] = useState<Notation>('chord')
  const [transpose, setTranspose] = useState(0)
  const [autoScroll, setAutoScroll] = useState(false)
  const [speed, setSpeed] = useState(2)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll do palco.
  useEffect(() => {
    if (!open || !autoScroll) return
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    let carry = 0
    const tick = () => {
      carry += speed * 0.35
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
  }, [open, autoScroll, speed])

  // Esc sai do palco.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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
        <span className="inline-block h-[9px] w-[9px] rounded-[2px] border-[1.5px] border-folha" />
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
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-none rounded-md bg-gold px-4 py-2.5 font-cifra text-[11px] uppercase tracking-wide text-palco"
            >
              sair do palco
            </button>
          </div>

          {/* corpo */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 md:px-16">
            <div className="mx-auto max-w-3xl">
              {sheet ? (
                renderDark(sheet, disp)
              ) : (
                <div className="font-editorial text-[22px] italic text-[#f0e9da]/60">
                  cifra não disponível pra este formato.
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
                min={1}
                max={5}
                step={1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
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
