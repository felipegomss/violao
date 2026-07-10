'use client'

import { useEffect, useRef, useState } from 'react'
import { Repeat, X } from 'lucide-react'
import { youtubeId, formatTime } from '@/lib/song/youtube'
import { loadYouTubeApi, getYT } from './yt-loader'

type YTPlayer = {
  getCurrentTime: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
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
          onReady: () => setReady(true),
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
