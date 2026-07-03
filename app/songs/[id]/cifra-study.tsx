'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { transposeChord, degreeChord } from '@/lib/chords/transform'
import { chordDiagram, type ChordShape } from '@/lib/chords/diagram'
import { suggestScrollSpeed } from '@/lib/song/autoscroll'
import { setComoEstouTocando } from '@/app/actions/songs'
import { EditorialCifra } from './editorial-cifra'
import { ChordDiagram } from './chord-diagram'
import { YoutubePlayer } from './youtube-player'

type Notation = 'chord' | 'degree'

const RATING_WORDS: Record<number, string> = {
  0: 'ainda não avaliado',
  1: 'começando a decifrar',
  2: 'ainda tropeçando',
  3: 'já sai, com atenção',
  4: 'fluindo bem',
  5: 'de olhos fechados',
}

export function CifraStudy({
  songId,
  sheet,
  parseFailed,
  rawContent,
  songKey,
  bpm,
  referenceYoutubeUrl,
  notes,
  comoEstouTocando,
}: {
  songId: string
  sheet: ChordSheetModel | null
  parseFailed: boolean
  rawContent: string
  songKey: string
  bpm: number | null
  referenceYoutubeUrl: string | null
  notes: string | null
  comoEstouTocando: number | null
}) {
  const [notation, setNotation] = useState<Notation>('chord')
  const [transpose, setTranspose] = useState(0)
  const [autoScroll, setAutoScroll] = useState(false)
  const [pxPerSec, setPxPerSec] = useState(14)
  const suggestedOnce = useRef(false)
  const [rating, setRating] = useState(comoEstouTocando ?? 0)
  const [metronomeOn, setMetronomeOn] = useState(false)
  const [beat, setBeat] = useState(0)
  const [hover, setHover] = useState<
    { name: string; shape: ChordShape; top: number; left: number } | null
  >(null)

  // Hover num acorde → posiciona o diagrama perto dele. O lookup é client-side
  // (chords-db gzipa em ~26KB), então é instantâneo — sem round-trip por hover.
  const onChordHover = (chord: string, el: HTMLElement | null) => {
    if (!chord || !el) {
      setHover(null)
      return
    }
    const shape = chordDiagram(chord)
    if (!shape) {
      setHover(null)
      return
    }
    const r = el.getBoundingClientRect()
    const TIP_W = 130
    const TIP_H = 168
    const left = Math.max(8, Math.min(r.left, window.innerWidth - TIP_W - 8))
    const top =
      r.bottom + 6 + TIP_H > window.innerHeight ? r.top - TIP_H - 6 : r.bottom + 6
    setHover({ name: chord, shape, top, left })
  }

  // Mede a página no mount e sugere a velocidade pela BPM (a folha inteira rola
  // ~na duração da música). Roda uma vez; depois o usuário ajusta no slider.
  useEffect(() => {
    if (suggestedOnce.current) return
    const rows = sheet ? sheet.lines.filter((l) => l.type === 'row').length : 0
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    setPxPerSec(suggestScrollSpeed({ scrollable, rows, bpm }))
    suggestedOnce.current = true
  }, [sheet, bpm])

  // Auto-scroll: rola a JANELA (na view normal a página cresce e quem rola é a
  // window, não um container interno). Baseado em TEMPO (px/s via timestamp do
  // rAF), então a velocidade não depende do refresh do monitor.
  useEffect(() => {
    if (!autoScroll) return
    let raf = 0
    let last = 0
    let carry = 0
    const tick = (ts: number) => {
      if (!last) last = ts
      const dt = Math.min(0.05, (ts - last) / 1000) // clamp p/ aba em background
      last = ts
      carry += pxPerSec * dt
      const px = Math.floor(carry)
      if (px > 0) {
        window.scrollBy(0, px)
        carry -= px
      }
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 1
      if (atBottom) {
        setAutoScroll(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll, pxPerSec])

  // Metrônomo: tick de áudio (Web Audio) no BPM, acentuando o tempo 1 (compasso 4/4).
  useEffect(() => {
    if (!metronomeOn || !bpm) return
    const ctx = new AudioContext()
    void ctx.resume()
    let b = 0
    const period = 60 / bpm
    const tick = () => {
      const accent = b % 4 === 0
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = accent ? 1500 : 900
      gain.gain.setValueAtTime(accent ? 0.5 : 0.28, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.05)
      setBeat(b % 4)
      b += 1
    }
    tick()
    const id = setInterval(tick, period * 1000)
    return () => {
      clearInterval(id)
      void ctx.close()
    }
  }, [metronomeOn, bpm])

  const displayChord = (chord: string) =>
    notation === 'degree' ? degreeChord(chord, songKey) : transposeChord(chord, transpose)

  const shownSheet: ChordSheetModel | null = sheet && {
    lines: sheet.lines.map((line) =>
      line.type === 'row'
        ? {
            type: 'row' as const,
            items: line.items.map((it) => ({
              chord: it.chord ? displayChord(it.chord) : it.chord,
              lyrics: it.lyrics,
            })),
          }
        : line,
    ),
  }

  const transposeLabel =
    notation === 'degree'
      ? 'graus'
      : `${transpose > 0 ? '+' : ''}${transpose} · ${transposeChord(songKey, transpose)}`

  const rate = (n: number) => {
    setRating(n)
    void setComoEstouTocando(songId, n)
  }

  const rawPre = (
    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-ink/15 bg-folha p-4 font-cifra text-[13px] text-ink">
      {rawContent || '(vazio)'}
    </pre>
  )

  return (
    <>
    <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-[1fr_320px] lg:min-h-0">
      {/* Cifra sheet */}
      <div className="px-8 py-8 lg:px-10">
        {shownSheet ? (
          <EditorialCifra
            sheet={shownSheet}
            onChordHover={notation === 'chord' ? onChordHover : undefined}
          />
        ) : (
          <>
            {parseFailed && (
              <p className="mb-2 text-sm text-soft">
                não foi possível formatar; exibindo texto cru
              </p>
            )}
            {rawPre}
          </>
        )}

        {notes && (
          <div className="mt-9 max-w-[640px] rounded-r-md border-l-[3px] border-rust bg-[#efe7d5] px-5 py-4">
            <div className="mb-2 font-cifra text-[10px] uppercase tracking-[.2em] text-faint">
              Anotações do professor
            </div>
            <p className="font-editorial text-[17px] italic leading-relaxed text-[#3a342c]">
              {notes}
            </p>
          </div>
        )}
      </div>

      {/* Right rail */}
      <div className="flex flex-col border-t border-ink/12 bg-[#efe7d5] lg:border-l lg:border-t-0">
        {/* Player · referência — FUNCIONAL (YouTube IFrame + A-B loop) */}
        <YoutubePlayer url={referenceYoutubeUrl} />

        {/* Acompanhamento */}
        <div className="flex flex-col gap-4 border-b border-ink/12 p-[18px]">
          <div className="font-cifra text-[9px] uppercase tracking-[.2em] text-faint">
            Acompanhamento
          </div>

          {/* Notação — FUNCIONAL */}
          <div>
            <div className="mb-1.5 font-cifra text-[9px] tracking-[.06em] text-faint">NOTAÇÃO</div>
            <div className="flex overflow-hidden rounded-md border border-ink/22">
              <button
                type="button"
                onClick={() => setNotation('chord')}
                className={`flex-1 py-2 font-cifra text-[11px] tracking-[.04em] ${
                  notation === 'chord' ? 'bg-teal font-medium text-folha' : 'text-soft'
                }`}
              >
                Acorde
              </button>
              <button
                type="button"
                onClick={() => setNotation('degree')}
                className={`flex-1 py-2 font-cifra text-[11px] tracking-[.04em] ${
                  notation === 'degree' ? 'bg-teal font-medium text-folha' : 'text-soft'
                }`}
              >
                Grau
              </button>
            </div>
          </div>

          {/* Transpor — FUNCIONAL (desabilitado no modo grau) */}
          <div>
            <div className="mb-1.5 font-cifra text-[9px] tracking-[.06em] text-faint">TRANSPOR</div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTranspose((t) => Math.max(-6, t - 1))}
                disabled={notation === 'degree'}
                className="h-[34px] w-[34px] rounded-md border border-ink/22 bg-folha font-cifra text-base text-ink disabled:opacity-40"
              >
                −
              </button>
              <span className="flex-1 text-center font-cifra text-sm font-medium text-teal">
                {transposeLabel}
              </span>
              <button
                type="button"
                onClick={() => setTranspose((t) => Math.min(6, t + 1))}
                disabled={notation === 'degree'}
                className="h-[34px] w-[34px] rounded-md border border-ink/22 bg-folha font-cifra text-base text-ink disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Auto-scroll — FUNCIONAL */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-cifra text-[9px] tracking-[.06em] text-faint">AUTO-SCROLL</span>
              <button
                type="button"
                onClick={() => setAutoScroll((v) => !v)}
                className={`rounded border px-2 py-0.5 font-cifra text-[9px] uppercase tracking-[.1em] ${
                  autoScroll
                    ? 'border-transparent bg-rust text-folha'
                    : 'border-ink/22 text-soft'
                }`}
              >
                {autoScroll ? 'on' : 'off'}
              </button>
            </div>
            <input
              type="range"
              min={4}
              max={80}
              step={1}
              value={pxPerSec}
              onChange={(e) => setPxPerSec(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-0.5 flex justify-between font-cifra text-[8px] text-faint">
              <span>lento</span>
              <span>{pxPerSec} px/s</span>
              <span>rápido</span>
            </div>
          </div>

          {/* Metrônomo — FUNCIONAL (Web Audio) */}
          <div className="flex items-center justify-between">
            <span className="font-cifra text-[9px] tracking-[.06em] text-faint">METRÔNOMO</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => bpm && setMetronomeOn((v) => !v)}
                disabled={!bpm}
                className={`rounded border px-2 py-0.5 font-cifra text-[9px] uppercase tracking-[.1em] disabled:opacity-40 ${
                  metronomeOn ? 'border-transparent bg-rust text-folha' : 'border-ink/22 text-soft'
                }`}
              >
                {metronomeOn ? 'on' : 'off'}
              </button>
              <div className="flex gap-[3px]">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      metronomeOn && i === beat
                        ? i === 0
                          ? 'bg-rust'
                          : 'bg-teal'
                        : i === 0
                          ? 'bg-rust/40'
                          : 'bg-ink/20'
                    }`}
                  />
                ))}
              </div>
              <span className="font-cifra text-[13px] font-medium text-ink">
                {bpm ?? '—'} <span className="text-[9px] text-faint">bpm</span>
              </span>
            </div>
          </div>
        </div>

        {/* Como estou tocando — FUNCIONAL */}
        <div className="p-[18px]">
          <div className="mb-2.5 font-cifra text-[9px] uppercase tracking-[.2em] text-faint">
            Como estou tocando
          </div>
          <div className="mb-2 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`nota ${n}`}
                onClick={() => rate(n)}
                className={`h-3 w-[26px] rounded-sm ${n <= rating ? 'bg-teal' : 'bg-ink/[.16]'}`}
              />
            ))}
          </div>
          <div className="font-editorial text-[15px] italic text-soft">{RATING_WORDS[rating]}</div>
        </div>
      </div>
    </div>

    {hover && (
      <div
        className="pointer-events-none fixed z-40 rounded-xl border border-ink/20 bg-folha px-3 py-2.5 shadow-[0_18px_40px_-18px_rgba(22,19,15,.55)]"
        style={{ top: hover.top, left: hover.left }}
      >
        <ChordDiagram name={hover.name} shape={hover.shape} />
      </div>
    )}
    </>
  )
}
