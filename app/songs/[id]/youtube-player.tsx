'use client'

import { useEffect, useRef, useState } from 'react'
import { youtubeId, formatTime } from '@/lib/song/youtube'

type YTPlayer = {
  getCurrentTime: () => number
  getDuration: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  destroy: () => void
}

// Carrega a IFrame API do YouTube uma única vez (promessa memoizada no módulo).
let apiPromise: Promise<void> | null = null
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const w = window as unknown as {
    YT?: { Player: unknown }
    onYouTubeIframeAPIReady?: () => void
  }
  if (w.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
  })
  return apiPromise
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function YT(): any {
  return (window as unknown as { YT: unknown }).YT
}

export function YoutubePlayer({ url }: { url: string | null }) {
  const videoId = url ? youtubeId(url) : null

  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [a, setA] = useState<number | null>(null)
  const [b, setB] = useState<number | null>(null)
  const [loopOn, setLoopOn] = useState(false)

  // Cria o player e faz polling do tempo atual (a API é imperativa).
  useEffect(() => {
    if (!videoId) return
    let cancelled = false
    let interval: ReturnType<typeof setInterval>

    void loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return
      const player: YTPlayer = new (YT().Player)(hostRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            setDuration(e.target.getDuration())
            setReady(true)
          },
          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === YT().PlayerState.PLAYING)
            if (e.data === YT().PlayerState.PLAYING) {
              setDuration(playerRef.current?.getDuration() ?? 0)
            }
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

  if (!videoId) {
    return (
      <div className="border-b border-ink/12 p-[18px]">
        <div className="mb-2.5 font-cifra text-[9px] uppercase tracking-[.2em] text-faint">
          Player · referência
        </div>
        <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-ink/20 bg-folha/40">
          <span className="font-editorial text-[14px] italic text-soft">
            sem vídeo de referência
          </span>
        </div>
      </div>
    )
  }

  const frac = (t: number) => (duration > 0 ? Math.min(1, Math.max(0, t / duration)) * 100 : 0)

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ready || duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    playerRef.current?.seekTo(ratio * duration, true)
  }

  const toggle = () => {
    if (!ready) return
    if (playing) playerRef.current?.pauseVideo()
    else playerRef.current?.playVideo()
  }

  return (
    <div className="border-b border-ink/12 p-[18px]">
      <div className="mb-2.5 font-cifra text-[9px] uppercase tracking-[.2em] text-faint">
        Player · referência
      </div>

      <div className="aspect-video overflow-hidden rounded-md border border-ink/15 bg-ink/5">
        <div ref={hostRef} className="h-full w-full" />
      </div>

      {/* barra de progresso + região A-B */}
      <div
        onClick={seek}
        className="relative mt-3 h-2.5 cursor-pointer rounded bg-ink/[.14]"
      >
        {lo != null && hi != null && (
          <div
            className="absolute inset-y-0 rounded bg-teal/[.32]"
            style={{ left: `${frac(lo)}%`, right: `${100 - frac(hi)}%` }}
          />
        )}
        {a != null && (
          <div className="absolute -top-1 h-[18px] w-0.5 bg-teal" style={{ left: `${frac(a)}%` }} />
        )}
        {b != null && (
          <div className="absolute -top-1 h-[18px] w-0.5 bg-teal" style={{ left: `${frac(b)}%` }} />
        )}
        <div
          className="absolute -top-[3px] h-3 w-3 -translate-x-1/2 rounded-full bg-ink"
          style={{ left: `${frac(current)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          aria-label={playing ? 'pausar' : 'tocar'}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/[.82] disabled:opacity-40"
        >
          {playing ? (
            <span className="flex gap-[3px]">
              <span className="h-3 w-[3px] bg-folha" />
              <span className="h-3 w-[3px] bg-folha" />
            </span>
          ) : (
            <span className="ml-[2px] h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-folha" />
          )}
        </button>
        <span className="font-cifra text-[11px] tabular-nums text-soft">
          {formatTime(current)} / {duration > 0 ? formatTime(duration) : '—'}
        </span>
      </div>

      {/* A-B loop */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => ready && setA(current)}
          disabled={!ready}
          className={`flex-1 rounded border py-1 font-cifra text-[10px] tracking-[.06em] disabled:opacity-40 ${
            a != null ? 'border-teal/40 bg-teal/10 text-teal' : 'border-ink/22 text-soft'
          }`}
        >
          A {a != null && <span className="tabular-nums">{formatTime(a)}</span>}
        </button>
        <button
          type="button"
          onClick={() => ready && setB(current)}
          disabled={!ready}
          className={`flex-1 rounded border py-1 font-cifra text-[10px] tracking-[.06em] disabled:opacity-40 ${
            b != null ? 'border-teal/40 bg-teal/10 text-teal' : 'border-ink/22 text-soft'
          }`}
        >
          B {b != null && <span className="tabular-nums">{formatTime(b)}</span>}
        </button>
        <button
          type="button"
          onClick={() => setLoopOn((v) => !v)}
          disabled={lo == null || hi == null || hi <= lo}
          className={`rounded border px-2 py-1 font-cifra text-[9px] uppercase tracking-[.1em] disabled:opacity-40 ${
            loopOn ? 'border-transparent bg-rust text-folha' : 'border-ink/22 text-soft'
          }`}
        >
          ◱ loop
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
            className="rounded border border-ink/22 px-1.5 py-1 font-cifra text-[11px] text-faint hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
