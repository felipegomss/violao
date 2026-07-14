'use client'

import { useEffect, useRef, useState } from 'react'
import { Repeat, Volume1, Volume2, VolumeX, X } from 'lucide-react'
import { youtubeId, formatTime } from '@/lib/song/youtube'
import { loadYouTubeApi, getYT } from './yt-loader'

type YTPlayer = {
  getCurrentTime: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setVolume: (v: number) => void
  getVolume: () => number
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  destroy: () => void
}

export function YoutubePlayer({ url }: { url: string | null }) {
  const videoId = url ? youtubeId(url) : null

  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  const [ready, setReady] = useState(false)
  const [current, setCurrent] = useState(0)
  const [a, setA] = useState<number | null>(null)
  const [b, setB] = useState<number | null>(null)
  const [loopOn, setLoopOn] = useState(false)
  // Volume próprio: no player pequeno o slider nativo do YouTube fica espremido.
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)

  // Play/pause e seek ficam por conta dos controles nativos do próprio iframe.
  // Aqui só criamos o player e fazemos polling do tempo pro A-B loop.
  useEffect(() => {
    if (!videoId) return
    let cancelled = false
    let interval: ReturnType<typeof setInterval>

    void loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return
      const player: YTPlayer = new (getYT().Player)(hostRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            setReady(true)
            setVolume(Math.round(e.target.getVolume()))
            setMuted(e.target.isMuted())
          },
        },
      })
      playerRef.current = player
      interval = setInterval(() => {
        const p = playerRef.current
        if (p?.getCurrentTime) setCurrent(p.getCurrentTime())
      }, 200)
    })

    return () => {
      cancelled = true
      clearInterval(interval)
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [videoId])

  // A-B loop: ao passar do fim da região, volta pro início.
  const lo = a != null && b != null ? Math.min(a, b) : null
  const hi = a != null && b != null ? Math.max(a, b) : null
  useEffect(() => {
    if (loopOn && lo != null && hi != null && hi > lo && current >= hi) {
      playerRef.current?.seekTo(lo, true)
    }
  }, [current, loopOn, lo, hi])

  // Sem vídeo não há player — quem decide mostrar ou não é o pai.
  if (!videoId) return null

  return (
    <div>
      <div className="aspect-video overflow-hidden rounded-lg border border-ink/15 bg-ink/5">
        <div ref={hostRef} className="h-full w-full" />
      </div>

      {/* Volume — o slider nativo é pequeno demais nesse tamanho de player */}
      <div className="mt-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            const p = playerRef.current
            if (!p || !ready) return
            if (muted) {
              p.unMute()
              if (volume === 0) {
                p.setVolume(50)
                setVolume(50)
              }
              setMuted(false)
            } else {
              p.mute()
              setMuted(true)
            }
          }}
          disabled={!ready}
          aria-label={muted ? 'ativar som' : 'silenciar'}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-ink/22 text-soft transition-colors duration-150 ease-out hover:text-ink disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2"
        >
          {muted || volume === 0 ? (
            <VolumeX size={15} strokeWidth={2} />
          ) : volume < 50 ? (
            <Volume1 size={15} strokeWidth={2} />
          ) : (
            <Volume2 size={15} strokeWidth={2} />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={muted ? 0 : volume}
          disabled={!ready}
          onChange={(e) => {
            const v = Number(e.target.value)
            const p = playerRef.current
            setVolume(v)
            if (!p) return
            p.setVolume(v)
            if (v > 0 && muted) {
              p.unMute()
              setMuted(false)
            } else if (v === 0 && !muted) {
              p.mute()
              setMuted(true)
            }
          }}
          aria-label="volume"
          className="h-1 flex-1 cursor-pointer accent-teal disabled:opacity-40"
        />
        <span className="w-7 flex-none text-right font-cifra text-[11px] tabular-nums text-faint">
          {muted ? 0 : volume}
        </span>
      </div>

      {/* A-B loop — o que o player nativo não faz */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => ready && setA(current)}
          disabled={!ready}
          className={`h-9 flex-1 rounded-lg border font-cifra text-[11px] transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 ${
            a != null ? 'border-teal/40 bg-teal/10 text-teal' : 'border-ink/22 text-soft hover:text-ink'
          }`}
        >
          A {a != null && <span className="tabular-nums">{formatTime(a)}</span>}
        </button>
        <button
          type="button"
          onClick={() => ready && setB(current)}
          disabled={!ready}
          className={`h-9 flex-1 rounded-lg border font-cifra text-[11px] transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 ${
            b != null ? 'border-teal/40 bg-teal/10 text-teal' : 'border-ink/22 text-soft hover:text-ink'
          }`}
        >
          B {b != null && <span className="tabular-nums">{formatTime(b)}</span>}
        </button>
        <button
          type="button"
          onClick={() => setLoopOn((v) => !v)}
          disabled={lo == null || hi == null || hi <= lo}
          className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 font-cifra text-[11px] lowercase transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 ${
            loopOn ? 'border-transparent bg-teal text-folha' : 'border-ink/22 text-soft hover:text-ink'
          }`}
        >
          <Repeat size={12} strokeWidth={2} />
          loop
        </button>
        {(a != null || b != null) && (
          <button
            type="button"
            onClick={() => {
              setA(null)
              setB(null)
              setLoopOn(false)
            }}
            aria-label="limpar A-B"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/22 text-faint transition-colors duration-150 ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  )
}
