'use client'

import { useEffect, useRef, useState } from 'react'
import { GripHorizontal, Maximize2, Minus, X } from 'lucide-react'
import { YoutubePlayer } from './youtube-player'

const PANEL_W = 360
const BTN =
  'flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors duration-150 ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

const EQ_N = 5

// Equalizer no tempo da música: a cada meia batida (60/bpm, default 120) sorteia
// alturas novas pras barras — aleatório de verdade, sincronizado ao tempo, com
// transição suave entre os valores. Para ao pausar; respeita reduced-motion.
function SoundBars({ playing, bpm }: { playing: boolean; bpm: number | null }) {
  const beat = 60 / (bpm && bpm > 0 ? bpm : 120)
  const period = Math.max(90, Math.round((beat * 1000) / 2))
  const [heights, setHeights] = useState<number[]>(() => Array(EQ_N).fill(0.3))

  useEffect(() => {
    if (!playing) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setHeights(Array.from({ length: EQ_N }, () => 0.22 + Math.random() * 0.78))
    }, period)
    return () => clearInterval(id)
  }, [playing, period])

  return (
    <span aria-hidden className="flex h-3 items-end gap-[2px]">
      {Array.from({ length: EQ_N }, (_, i) => (
        <span
          key={i}
          className="h-full w-[3px] origin-bottom rounded-full bg-teal transition-transform ease-out"
          style={{
            transform: `scaleY(${playing ? heights[i] : 0.28})`,
            transitionDuration: `${period}ms`,
          }}
        />
      ))}
    </span>
  )
}

// Vídeo de referência como painel flutuante e arrastável (pela barra do topo).
// Minimizar colapsa só o vídeo — os controles (play/pause, progresso, volume)
// seguem visíveis e o áudio continua. Fechar (X) desmonta e para.
export function FloatingVideo({
  url,
  bpm,
  onClose,
}: {
  url: string
  bpm: number | null
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return { x: 24, y: 80 }
    const w = Math.min(PANEL_W, window.innerWidth - 16)
    return { x: Math.max(8, window.innerWidth - w - 24), y: 80 }
  })
  const [dragging, setDragging] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [playing, setPlaying] = useState(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const orig = { ...pos }
    setDragging(true)
    const move = (ev: PointerEvent) => {
      const el = panelRef.current
      const w = el?.offsetWidth ?? PANEL_W
      const h = el?.offsetHeight ?? 240
      const nx = Math.min(Math.max(0, orig.x + ev.clientX - startX), window.innerWidth - w)
      const ny = Math.min(Math.max(0, orig.y + ev.clientY - startY), window.innerHeight - Math.min(h, 48))
      setPos({ x: nx, y: ny })
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={panelRef}
      className={`fixed z-40 max-w-[calc(100vw-16px)] rounded-xl border border-ink/20 bg-folha shadow-[0_24px_50px_-20px_rgba(38,33,27,.55)] ${
        minimized ? 'w-[264px]' : 'w-[360px]'
      }`}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* barra de arraste + controles */}
      <div
        onPointerDown={onPointerDown}
        className={`flex touch-none select-none items-center justify-between gap-2 border-b border-ink/12 px-3 py-2 ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {minimized ? (
          <span className="flex items-center gap-2 font-cifra text-[11px] lowercase text-soft">
            {/* equalizer no tempo da música: anima tocando, para ao pausar */}
            <SoundBars playing={playing} bpm={bpm} />
            áudio
          </span>
        ) : (
          <span className="flex items-center gap-2 font-cifra text-[11px] lowercase text-faint">
            <GripHorizontal size={14} strokeWidth={2} />
            vídeo de referência
          </span>
        )}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={minimized ? 'restaurar vídeo' : 'minimizar vídeo'}
            onClick={() => setMinimized((v) => !v)}
            className={BTN}
          >
            {minimized ? <Maximize2 size={15} strokeWidth={2} /> : <Minus size={16} strokeWidth={2} />}
          </button>
          <button type="button" aria-label="fechar vídeo" onClick={onClose} className={BTN}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
      {/* Player sempre montado (o vídeo colapsa dentro dele quando minimizado, o
          áudio segue). O vídeo é pointer-events-none, então o arraste passa por
          cima dele sem problema. */}
      <div className="p-2">
        <YoutubePlayer url={url} minimized={minimized} onPlayingChange={setPlaying} />
      </div>
    </div>
  )
}
