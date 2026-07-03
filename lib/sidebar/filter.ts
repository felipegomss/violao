// Busca de músicas da sidebar: casa por título ou artista, insensível a caixa e
// a acento (normaliza NFD e remove diacríticos dos dois lados).
export type SidebarSong = { slug: string; title: string; artists: string[]; key: string }

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (combining marks)
    .toLowerCase()

export function filterSongs<T extends SidebarSong>(songs: T[], q: string): T[] {
  const needle = fold(q.trim())
  if (!needle) return songs
  return songs.filter((s) => fold(`${s.title} ${s.artists.join(' ')}`).includes(needle))
}
