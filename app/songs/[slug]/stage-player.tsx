'use client'

import { useEffect, useRef, useState } from 'react'
import { Music2, Pause, Play, RotateCcw } from 'lucide-react'
import { youtubeId } from '@/lib/song/youtube'
import { loadYouTubeApi, getYT } from './yt-loader'

type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  destroy: () => void
}

const FOCUS_PALCO =
  'focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2'
const AUDIO_BTN = `flex h-11 w-11 items-center justify-center rounded-lg border border-[#f0e9da]/25 text-[#f0e9da] transition-colors duration-150 ease-out hover:bg-[#f0e9da]/5 disabled:opacity-30 ${FOCUS_PALCO}`

// Player de áudio do palco: toca a faixa de referência (YouTube) só com o
// essencial — tocar, pausar, recomeçar. O iframe fica fora da tela (só o som
// importa aqui). Estados de play/pause vêm do onStateChange do próprio player.
export function StagePlayer({ url }: { url: string }) {
  const videoId = youtubeId(url)
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!videoId) return
    let cancelled = false
    void loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return
      const player: YTPlayer = new (getYT().Player)(hostRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => setReady(true),
          // 1 = tocando, 2 = pausado, 0 = fim
          onStateChange: (e: { data: number }) => setPlaying(e.data === 1),
        },
      })
      playerRef.current = player
    })
    return () => {
      cancelled = true
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [videoId])

  if (!videoId) return null

  const toggle = () => {
    const p = playerRef.current
    if (!p) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }
  const restart = () => {
    const p = playerRef.current
    if (!p) return
    p.seekTo(0, true)
    p.playVideo()
  }

  return (
    <>
      {/* iframe fora da tela — só o áudio interessa */}
      <div aria-hidden className="pointer-events-none fixed -left-[9999px] bottom-0 h-[120px] w-[200px] overflow-hidden">
        <div ref={hostRef} className="h-full w-full" />
      </div>

      {/* Cluster de áudio — retangular + ícone de música pra não confundir com
          o botão redondo do auto-scroll (que é rolagem, não som). */}
      <div className="flex items-center gap-2">
        <Music2 size={15} strokeWidth={2} className="mr-0.5 flex-none text-stageblue" aria-hidden />
        <button
          type="button"
          onClick={restart}
          disabled={!ready}
          aria-label="recomeçar do início"
          title="recomeçar"
          className={AUDIO_BTN}
        >
          <RotateCcw size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          aria-pressed={playing}
          aria-label={playing ? 'pausar música' : 'tocar música'}
          className={`${AUDIO_BTN} ${playing ? 'border-gold/50 bg-gold/15 text-gold' : ''}`}
        >
          {playing ? (
            <Pause size={18} strokeWidth={2} fill="currentColor" />
          ) : (
            <Play size={18} strokeWidth={2} fill="currentColor" className="ml-0.5" />
          )}
        </button>
      </div>
    </>
  )
}
