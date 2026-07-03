// Extrai o ID do vídeo de uma URL do YouTube (watch, youtu.be, embed, shorts).
export function youtubeId(url: string): string | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') {
    return u.pathname.slice(1) || null
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (u.pathname === '/watch') return u.searchParams.get('v')
    const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)
    if (m) return m[1]
  }
  return null
}

// Segundos → "m:ss". Negativos/NaN viram "0:00".
export function formatTime(seconds: number): string {
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
