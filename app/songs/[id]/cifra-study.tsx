'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ChordSheet as ChordSheetModel } from '@/lib/chordsheet/parse'
import { transposeChord, degreeChord } from '@/lib/chords/transform'
import { chordDiagram, type ChordShape } from '@/lib/chords/diagram'
import { suggestScrollSpeed } from '@/lib/song/autoscroll'
import { setComoEstouTocando } from '@/app/actions/songs'
import { EditorialCifra } from './editorial-cifra'
import { ChordDiagram } from './chord-diagram'
import { ChordStrip } from './chord-strip'
import { StudyBar, type FontScale } from './study-bar'
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

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

// A folha inteira (header incluso) é client: o "tom" do header é um metadado
// vivo — reflete a transposição da régua — então o header mora aqui e o
// page.tsx (server) só injeta as ações (palco, ⋯) como ReactNode.
export function CifraStudy({
  songId,
  title,
  artists,
  genres,
  capo,
  tuning,
  version,
  actions,
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
  title: string
  artists: string[]
  genres: string[]
  capo: number | null
  tuning: string
  version: string | null
  actions?: ReactNode
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
  const [fontScale, setFontScale] = useState<FontScale>(1)
  const [autoScroll, setAutoScroll] = useState(false)
  const [pxPerSec, setPxPerSec] = useState(14)
  const suggestedOnce = useRef(false)
  const [rating, setRating] = useState(comoEstouTocando ?? 0)
  const [metronomeOn, setMetronomeOn] = useState(false)
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
  // ~na duração da música). Roda uma vez; depois o usuário ajusta na régua.
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

  // Espaço alterna o auto-scroll — exceto quando o foco está num controle
  // (input/textarea/select/botão/summary/contenteditable), que fica com a tecla.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, select, button, a, summary') || t?.isContentEditable)
        return
      e.preventDefault()
      setAutoScroll((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
      b += 1
    }
    tick()
    const id = setInterval(tick, period * 1000)
    return () => {
      clearInterval(id)
      void ctx.close()
    }
  }, [metronomeOn, bpm])

  const shownSheet: ChordSheetModel | null = useMemo(() => {
    if (!sheet) return null
    const displayChord = (chord: string) =>
      notation === 'degree' ? degreeChord(chord, songKey) : transposeChord(chord, transpose)
    return {
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
  }, [sheet, notation, transpose, songKey])

  // Acordes únicos (já transpostos), na ordem de aparição — alimenta a linha
  // de diagramas. Em modo grau os tokens viram graus e nenhum tem shape.
  const uniqueChords = useMemo(() => {
    if (!shownSheet) return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const line of shownSheet.lines) {
      if (line.type !== 'row') continue
      for (const it of line.items) {
        if (it.chord && !seen.has(it.chord)) {
          seen.add(it.chord)
          out.push(it.chord)
        }
      }
    }
    return out
  }, [shownSheet])

  const rate = (n: number) => {
    setRating(n)
    void setComoEstouTocando(songId, n)
  }

  const shownKey = transposeChord(songKey, transpose)

  const tomNode =
    notation === 'chord' && transpose !== 0 ? (
      <span className="inline-flex items-center gap-2">
        <span>
          tom {songKey} → <span className="font-medium text-teal">{shownKey}</span>
        </span>
        <button
          type="button"
          onClick={() => setTranspose(0)}
          className={`-my-2 py-2 font-cifra text-[11px] lowercase text-teal underline underline-offset-4 transition-colors duration-150 ease-out hover:text-ink ${FOCUS}`}
        >
          restaurar
        </button>
      </span>
    ) : (
      <span>
        tom <span className="font-medium text-teal">{songKey}</span>
      </span>
    )

  const metaParts: ReactNode[] = [tomNode]
  if (capo != null && capo > 0) metaParts.push(`capo ${capo}ª`)
  metaParts.push(tuning)
  if (version) metaParts.push(`v. ${version}`)
  if (genres.length > 0) metaParts.push(genres.join(', '))

  const rawPre = (
    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-ink/15 bg-folha p-4 font-cifra text-[13px] text-ink">
      {rawContent || '(vazio)'}
    </pre>
  )

  return (
    <>
      <div className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-8 pb-32 md:px-8">
        {/* Header editorial */}
        <header className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-editorial text-[40px] font-semibold leading-none">{title}</h1>
            <div className="mt-2 font-editorial text-[19px] italic text-teal">
              {artists.join(', ')}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-cifra text-[13px] text-soft">
              {metaParts.map((part, i) => (
                <span key={i} className="inline-flex items-center gap-x-2">
                  {i > 0 && (
                    <span aria-hidden className="text-faint">
                      ·
                    </span>
                  )}
                  {part}
                </span>
              ))}
            </div>
          </div>
          {actions && <div className="flex flex-none items-center gap-3">{actions}</div>}
        </header>

        {/* Vídeo de referência — colapsável, só existe quando há vídeo */}
        {referenceYoutubeUrl && (
          <details className="group mt-6">
            <summary
              className={`flex h-11 w-fit cursor-pointer list-none items-center gap-2 font-cifra text-[11px] lowercase text-soft transition-colors duration-150 ease-out hover:text-ink [&::-webkit-details-marker]:hidden ${FOCUS}`}
            >
              <ChevronDown
                size={16}
                strokeWidth={2}
                className="transition-transform duration-150 ease-out group-open:rotate-180"
              />
              vídeo de referência
            </summary>
            <div className="mt-2">
              <YoutubePlayer url={referenceYoutubeUrl} />
            </div>
          </details>
        )}

        {/* Linha de diagramas dos acordes usados */}
        {uniqueChords.length > 0 && (
          <div className="mt-6">
            <ChordStrip chords={uniqueChords} />
          </div>
        )}

        {/* Cifra — o wrapper controla o A−/A+ da régua (EditorialCifra usa em) */}
        <div className="mt-8" style={{ fontSize: `${fontScale}em` }}>
          {shownSheet ? (
            <EditorialCifra
              sheet={shownSheet}
              onChordHover={notation === 'chord' ? onChordHover : undefined}
            />
          ) : (
            <>
              {parseFailed && (
                <p className="mb-2 text-sm text-soft">
                  não deu pra formatar. Tá aí o texto cru mesmo.
                </p>
              )}
              {rawPre}
            </>
          )}
        </div>

        {notes && (
          <div className="mt-8 max-w-[640px] rounded-r-md border-l-2 border-rust bg-[#efe7d5] px-4 py-4">
            <div className="mb-2 font-cifra text-[11px] lowercase text-faint">
              anotações do professor
            </div>
            <p className="font-editorial text-[16px] italic leading-relaxed text-[#3a342c]">
              {notes}
            </p>
          </div>
        )}

        {/* Como estou tocando — linha editorial no fim da folha */}
        <div className="mt-12 flex max-w-[640px] flex-wrap items-center gap-x-4 gap-y-2 border-t border-dotted border-ink/15 pt-6">
          <span className="font-cifra text-[11px] lowercase text-faint">como estou tocando</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`nota ${n}`}
                aria-pressed={n <= rating}
                onClick={() => rate(n)}
                className={`flex h-11 w-[26px] items-center ${FOCUS}`}
              >
                <span
                  className={`h-3 w-full rounded-sm transition-colors duration-150 ease-out ${
                    n <= rating ? 'bg-teal' : 'bg-ink/[.16]'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="font-editorial text-[14px] italic text-soft">
            {RATING_WORDS[rating]}
          </span>
        </div>
      </div>

      <StudyBar
        songKey={songKey}
        notation={notation}
        onNotation={setNotation}
        transpose={transpose}
        onTranspose={setTranspose}
        fontScale={fontScale}
        onFontScale={setFontScale}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll((v) => !v)}
        pxPerSec={pxPerSec}
        onPxPerSec={setPxPerSec}
        bpm={bpm}
        metronomeOn={metronomeOn}
        onToggleMetronome={() => setMetronomeOn((v) => !v)}
      />

      {hover && (
        <div
          className="pointer-events-none fixed z-40 rounded-xl border border-ink/20 bg-folha px-3 py-2.5 shadow-[0_18px_40px_-18px_rgba(38,33,27,.55)]"
          style={{ top: hover.top, left: hover.left }}
        >
          <ChordDiagram name={hover.name} shape={hover.shape} />
        </div>
      )}
    </>
  )
}
