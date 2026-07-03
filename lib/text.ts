// Normalização de texto pra busca/ordenação insensível a caixa e acento
// (dobra NFD e remove diacríticos). Usado no cliente e no servidor pra manter a
// mesma noção de "igual" (ex.: "acao" casa "Ação").
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (combining marks)
    .toLowerCase()
    .trim()
}

// Texto de busca de uma música (título + artistas), dobrado. É o que vai na
// coluna Song.searchText e o que a busca do servidor compara.
export function songSearchText(title: string, artists: string[]): string {
  return fold(`${title} ${artists.join(' ')}`)
}

// Chave de ordenação por artista (1º artista dobrado). Prisma não ordena por
// elemento de array, então guardamos isto em Song.artistSort.
export function songArtistSort(artists: string[]): string {
  return fold(artists[0] ?? '')
}
