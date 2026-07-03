import { preInner, toChordPro, decodeEntities, type ImportResult } from './engine'

export function isCifraClub(host: string): boolean {
  return host === 'cifraclub.com.br' || host.endsWith('.cifraclub.com.br')
}

// CifraClub: acordes já em <b>, seções em [colchetes], tabs em <span class="cnt">.
// O motor já entende esse formato — a normalização é praticamente nula.
export function parseCifraClub(html: string): ImportResult {
  const parts = (html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '')
    .replace(/\s*-\s*Cifra Club\s*$/i, '')
    .split(' - ')
    .map((p) => decodeEntities(p).trim())
  const key = html.match(/\btom:\s*<[^>]*>(?:\s*<[^>]*>)?\s*([A-G][#b]?m?)\b/i)?.[1] ?? ''
  return toChordPro(
    { title: parts[0] ?? '', artist: parts[1] ?? '', key, version: 'Cifra Club' },
    preInner(html),
  )
}
