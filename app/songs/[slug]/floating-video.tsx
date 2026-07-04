'use client'

import { useRef, useState } from 'react'
import { GripHorizontal, Maximize2, Minus, X } from 'lucide-react'
import { YoutubePlayer } from './youtube-player'

const PANEL_W = 360
const BTN =
  'flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors duration-150 ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'

// Vídeo de referência como painel flutuante e arrastável (pela barra do topo).
// Minimizar mantém o player montado (segue tocando + loop A-B), só colapsa o
// vídeo e mostra um indicador. Fechar (X) desmonta e para.
export function FloatingVideo({ url, onClose }: { url: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return { x: 24, y: 80 }
    const w = Math.min(PANEL_W, window.innerWidth - 16)
    return { x: Math.max(8, window.innerWidth - w - 24), y: 80 }
  })
  const [dragging, setDragging] = useState(false)
  const [minimized, setMinimized] = useState(false)

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
      className={`fixed z-40 max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-ink/20 bg-folha shadow-[0_24px_50px_-20px_rgba(38,33,27,.55)] ${
        minimized ? 'w-56' : 'w-[360px]'
      }`}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* barra de arraste + controles */}
      <div
        onPointerDown={onPointerDown}
        className={`flex touch-none select-none items-center justify-between gap-2 px-3 py-2 ${
          minimized ? '' : 'border-b border-ink/12'
        } ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {minimized ? (
          <span className="flex items-center gap-2 font-cifra text-[11px] lowercase text-soft">
            {/* indicador de que segue tocando */}
            <span aria-hidden className="h-2 w-2 flex-none rounded-full bg-teal motion-safe:animate-pulse" />
            vídeo minimizado
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
      {/* Mantém o player montado mesmo minimizado (segue tocando/loop) — só colapsa.
          Escudo de pointer-events enquanto arrasta, senão o iframe engole o drag. */}
      <div className={minimized ? 'h-0 overflow-hidden' : `p-2 ${dragging ? 'pointer-events-none' : ''}`}>
        <YoutubePlayer url={url} />
      </div>
    </div>
  )
}
