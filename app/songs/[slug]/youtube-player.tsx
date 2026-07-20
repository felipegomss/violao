'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Repeat, Volume1, Volume2, VolumeX, X } from 'lucide-react'
import { youtubeId, formatTime } from '@/lib/song/youtube'
import { loadYouTubeApi, getYT } from './yt-loader'

type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  getCurrentTime: () => number
  getDuration: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setVolume: (v: number) => void
  getVolume: () => number
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  destroy: () => void
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2'
const ICON_BTN = `flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-ink/22 text-soft transition-colors duration-150 ease-out hover:text-ink disabled:pointer-events-none disabled:opacity-40 ${FOCUS}`

function VolIcon({ muted, volume, size }: { muted: boolean; volume: number; size: number }) {
  if (muted || volume === 0) return <VolumeX size={size} strokeWidth={2} />
  return volume < 50 ? (
    <Volume1 size={size} strokeWidth={2} />
  ) : (
    <Volume2 size={size} strokeWidth={2} />
  )
}

// Volume estilo Windows: só o ícone; ao clicar, abre um popover com o slider.
// Deixa a linha (e o modo minimizado) mais enxuta.
function VolumeControl({
  volume,
  muted,
  ready,
  onToggleMute,
  onChangeVolume,
}: {
  volume: number
  muted: boolean
  ready: boolean
  onToggleMute: () => void
  onChangeVolume: (v: number) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex-none">
      <button
        type="button"
        onClick={() => ready && setOpen((o) => !o)}
        disabled={!ready}
        aria-label="volume"
        aria-expanded={open}
        className={`${ICON_BTN} ${open ? 'border-teal/40 text-teal' : ''}`}
      >
        <VolIcon muted={muted} volume={volume} size={15} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute bottom-full right-0 z-20 mb-2 flex items-center gap-2 rounded-lg border border-ink/20 bg-folha px-2.5 py-2 shadow-[0_16px_34px_-14px_rgba(38,33,27,.5)]">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'ativar som' : 'silenciar'}
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-md text-soft transition-colors duration-150 ease-out hover:text-ink ${FOCUS}`}
            >
              <VolIcon muted={muted} volume={volume} size={14} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              aria-label="ajustar volume"
              className={`h-1 w-28 cursor-pointer accent-teal ${FOCUS}`}
            />
            <span className="w-6 flex-none text-right font-cifra text-[11px] tabular-nums text-faint">
              {muted ? 0 : volume}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// Player de referência com transporte PRÓPRIO: os controles nativos do YouTube
// (controls: 0) ficam espremidos no painel pequeno, então desenhamos play/pause,
// barra de progresso e volume aqui. `minimized` colapsa só o vídeo (o áudio e os
// controles seguem); `dragging` deixa o iframe passar o pointer pro arraste.
export function YoutubePlayer({
  url,
  minimized = false,
  onPlayingChange,
}: {
  url: string | null
  minimized?: boolean
  onPlayingChange?: (playing: boolean) => void
}) {
  const videoId = url ? youtubeId(url) : null

  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const seekingRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [a, setA] = useState<number | null>(null)
  const [b, setB] = useState<number | null>(null)
  const [loopOn, setLoopOn] = useState(false)
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)

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
        // controls: 0 tira a barra nativa (usamos a nossa). O cabeçalho/logo do
        // YouTube não some — é limite da API — mas a barra espremida sim.
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          disablekb: 1,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            setReady(true)
            setVolume(Math.round(e.target.getVolume()))
            setMuted(e.target.isMuted())
            setDuration(e.target.getDuration() || 0)
          },
          // 1 = tocando; qualquer outro estado = pausado/parado
          onStateChange: (e: { data: number }) => setPlaying(e.data === 1),
        },
      })
      playerRef.current = player
      interval = setInterval(() => {
        const p = playerRef.current
        if (!p?.getCurrentTime) return
        if (!seekingRef.current) setCurrent(p.getCurrentTime())
        setDuration(p.getDuration?.() || 0)
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

  // Avisa o pai (FloatingVideo) pra animar o equalizer do header.
  useEffect(() => {
    onPlayingChange?.(playing)
  }, [playing, onPlayingChange])

  if (!videoId) return null

  const togglePlay = () => {
    const p = playerRef.current
    if (!p || !ready) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }
  const seek = (v: number) => {
    setCurrent(v)
    playerRef.current?.seekTo(v, true)
  }
  const toggleMute = () => {
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
  }
  const changeVolume = (v: number) => {
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
  }

  return (
    <div>
      {/* vídeo — colapsa quando minimizado (o iframe segue montado, só h-0).
          pointer-events-none: como controlamos tudo pela nossa UI, bloqueamos o
          hover no iframe — some o preview de storyboard do YouTube (e o iframe
          deixa de engolir o arraste). */}
      <div
        className={
          minimized
            ? 'h-0 overflow-hidden'
            : 'pointer-events-none aspect-video overflow-hidden rounded-lg border border-ink/15 bg-ink/5'
        }
      >
        <div ref={hostRef} className="h-full w-full" />
      </div>

      {/* transporte: play/pause + progresso + tempo */}
      <div className={`flex items-center gap-2.5 ${minimized ? '' : 'mt-3'}`}>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          aria-label={playing ? 'pausar' : 'tocar'}
          className={ICON_BTN}
        >
          {playing ? (
            <Pause size={15} strokeWidth={2} fill="currentColor" />
          ) : (
            <Play size={15} strokeWidth={2} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(current, duration || 0)}
          disabled={!ready || !duration}
          onPointerDown={() => {
            seekingRef.current = true
          }}
          onPointerUp={() => {
            seekingRef.current = false
          }}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="posição"
          className={`h-1 min-w-0 flex-1 cursor-pointer accent-teal disabled:opacity-40 ${FOCUS}`}
        />
        <span className="w-[74px] flex-none text-right font-cifra text-[11px] tabular-nums text-soft">
          {formatTime(current)}
          <span className="text-faint"> / {formatTime(duration)}</span>
        </span>
        {/* no minimizado o volume mora aqui (ícone + popover), pra caber numa linha só */}
        {minimized && (
          <VolumeControl
            volume={volume}
            muted={muted}
            ready={ready}
            onToggleMute={toggleMute}
            onChangeVolume={changeVolume}
          />
        )}
      </div>

      {/* A-B loop + volume — dividem a linha no modo expandido */}
      {!minimized && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => ready && setA(current)}
            disabled={!ready}
            className={`h-9 flex-1 rounded-lg border font-cifra text-[11px] transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 ${FOCUS} ${
              a != null ? 'border-teal/40 bg-teal/10 text-teal' : 'border-ink/22 text-soft hover:text-ink'
            }`}
          >
            A {a != null && <span className="tabular-nums">{formatTime(a)}</span>}
          </button>
          <button
            type="button"
            onClick={() => ready && setB(current)}
            disabled={!ready}
            className={`h-9 flex-1 rounded-lg border font-cifra text-[11px] transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 ${FOCUS} ${
              b != null ? 'border-teal/40 bg-teal/10 text-teal' : 'border-ink/22 text-soft hover:text-ink'
            }`}
          >
            B {b != null && <span className="tabular-nums">{formatTime(b)}</span>}
          </button>
          <button
            type="button"
            onClick={() => setLoopOn((v) => !v)}
            disabled={lo == null || hi == null || hi <= lo}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 font-cifra text-[11px] lowercase transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 ${FOCUS} ${
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
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-ink/22 text-faint transition-colors duration-150 ease-out hover:text-ink ${FOCUS}`}
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
          <VolumeControl
            volume={volume}
            muted={muted}
            ready={ready}
            onToggleMute={toggleMute}
            onChangeVolume={changeVolume}
          />
        </div>
      )}
    </div>
  )
}
