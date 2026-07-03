'use client'

import { Minus, Pause, Play, Plus } from 'lucide-react'
import { transposeChord } from '@/lib/chords/transform'

// O lucide não tem metrônomo — este segue o traço da família (stroke 2,
// round, currentColor): corpo trapezoidal + pêndulo com peso.
function MetronomeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 3h4l4.2 18H5.8L10 3Z" />
      <path d="M12 15.5 17.5 5" />
      <circle cx="18" cy="4.2" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

type Notation = 'chord' | 'degree'

export const FONT_SCALES = [0.875, 1, 1.125] as const
export type FontScale = (typeof FONT_SCALES)[number]

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

const ICON_BTN = `flex h-11 w-11 flex-none items-center justify-center rounded-lg text-ink transition-colors duration-150 ease-out hover:bg-ink/5 disabled:pointer-events-none disabled:opacity-40 ${FOCUS}`

function Divider() {
  return <span aria-hidden className="mx-2 h-6 w-px flex-none bg-ink/10" />
}

// Régua de estudo: barra fixa com todos os controles de leitura da cifra —
// transpor · notação · fonte · auto-scroll · metrônomo. Pill flutuante no
// desktop, barra full-width colada no rodapé no mobile.
export function StudyBar({
  songKey,
  notation,
  onNotation,
  transpose,
  onTranspose,
  fontScale,
  onFontScale,
  autoScroll,
  onToggleAutoScroll,
  pxPerSec,
  onPxPerSec,
  bpm,
  metronomeOn,
  onToggleMetronome,
}: {
  songKey: string
  notation: Notation
  onNotation: (n: Notation) => void
  transpose: number
  onTranspose: (t: number) => void
  fontScale: FontScale
  onFontScale: (s: FontScale) => void
  autoScroll: boolean
  onToggleAutoScroll: () => void
  pxPerSec: number
  onPxPerSec: (v: number) => void
  bpm: number | null
  metronomeOn: boolean
  onToggleMetronome: () => void
}) {
  const degree = notation === 'degree'
  const scaleIdx = FONT_SCALES.indexOf(fontScale)

  const segBtn = (active: boolean) =>
    `h-9 flex-none rounded-lg px-3 font-cifra text-[11px] lowercase transition-colors duration-150 ease-out ${FOCUS} ${
      active ? 'bg-teal text-folha' : 'text-soft hover:bg-ink/5 hover:text-ink'
    }`

  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-ink/15 bg-folha px-4 py-2 shadow-[0_12px_32px_-12px_rgba(38,33,27,.4)] max-md:bottom-0 max-md:left-0 max-md:w-full max-md:translate-x-0 max-md:justify-between max-md:overflow-x-auto max-md:rounded-none">
      {/* transpor */}
      <button
        type="button"
        onClick={() => onTranspose(Math.max(-6, transpose - 1))}
        disabled={degree || transpose <= -6}
        aria-label="descer meio tom"
        className={ICON_BTN}
      >
        <Minus size={16} strokeWidth={2} />
      </button>
      <span
        title="transpor"
        className={`min-w-[3ch] flex-none text-center font-cifra text-[13px] font-medium ${
          degree ? 'text-faint' : 'text-teal'
        }`}
      >
        {degree ? '—' : transposeChord(songKey, transpose)}
      </span>
      <button
        type="button"
        onClick={() => onTranspose(Math.min(6, transpose + 1))}
        disabled={degree || transpose >= 6}
        aria-label="subir meio tom"
        className={ICON_BTN}
      >
        <Plus size={16} strokeWidth={2} />
      </button>

      <Divider />

      {/* notação */}
      <button
        type="button"
        onClick={() => onNotation('chord')}
        aria-pressed={!degree}
        className={segBtn(!degree)}
      >
        acorde
      </button>
      <button
        type="button"
        onClick={() => onNotation('degree')}
        aria-pressed={degree}
        className={segBtn(degree)}
      >
        grau
      </button>

      <Divider />

      {/* fonte */}
      <button
        type="button"
        onClick={() => onFontScale(FONT_SCALES[scaleIdx - 1])}
        disabled={scaleIdx <= 0}
        aria-label="diminuir letra"
        className={`${ICON_BTN} font-cifra text-[13px]`}
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => onFontScale(FONT_SCALES[scaleIdx + 1])}
        disabled={scaleIdx >= FONT_SCALES.length - 1}
        aria-label="aumentar letra"
        className={`${ICON_BTN} font-cifra text-[13px]`}
      >
        A+
      </button>

      <Divider />

      {/* auto-scroll */}
      <button
        type="button"
        onClick={onToggleAutoScroll}
        aria-pressed={autoScroll}
        aria-label={autoScroll ? 'pausar rolagem automática' : 'iniciar rolagem automática'}
        title="auto-scroll (espaço)"
        className={`${ICON_BTN} ${autoScroll ? 'text-teal' : ''}`}
      >
        {autoScroll ? (
          <Pause size={18} strokeWidth={2} fill="currentColor" />
        ) : (
          <Play size={18} strokeWidth={2} fill="currentColor" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onPxPerSec(Math.max(4, pxPerSec - 4))}
        disabled={pxPerSec <= 4}
        aria-label="rolagem mais lenta"
        className={ICON_BTN}
      >
        <Minus size={14} strokeWidth={2} />
      </button>
      <span
        title="velocidade da rolagem (px/s)"
        className="min-w-[3ch] flex-none text-center font-cifra text-[13px] tabular-nums text-soft"
      >
        {pxPerSec}
      </span>
      <button
        type="button"
        onClick={() => onPxPerSec(Math.min(80, pxPerSec + 4))}
        disabled={pxPerSec >= 80}
        aria-label="rolagem mais rápida"
        className={ICON_BTN}
      >
        <Plus size={14} strokeWidth={2} />
      </button>

      {/* metrônomo (só quando a música tem bpm) */}
      {bpm != null && bpm > 0 && (
        <>
          <Divider />
          <button
            type="button"
            onClick={onToggleMetronome}
            aria-pressed={metronomeOn}
            aria-label="metrônomo"
            className={`${ICON_BTN} ${metronomeOn ? 'text-teal' : ''}`}
          >
            <MetronomeIcon size={18} />
          </button>
          <span className="flex-none font-cifra text-[13px] tabular-nums text-soft">{bpm}</span>
        </>
      )}
    </div>
  )
}
