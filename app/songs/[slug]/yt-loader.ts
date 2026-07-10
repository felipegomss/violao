'use client'

// Carrega a IFrame API do YouTube uma única vez (promessa memoizada no módulo).
// Compartilhado pelo painel flutuante (YoutubePlayer) e pelo player de áudio do
// palco (StagePlayer).
let apiPromise: Promise<void> | null = null

export function loadYouTubeApi(): Promise<void> {
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
export function getYT(): any {
  return (window as unknown as { YT: unknown }).YT
}
