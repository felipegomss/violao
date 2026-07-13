import type { ChordSheetLine } from '@/lib/chordsheet/parse'

// Atalhos de navegação por seção: "Refrão" (e variações) ganha a tecla R; as
// demais seções recebem 1..9 na ordem em que aparecem. Devolve um mapa
// { índiceDaLinha → tecla } — usado pra desenhar o badge e pra rolar até o label.
const REFRAO = /refr[aã]o|chorus|estribilho/i

export function sectionKeys(lines: ChordSheetLine[]): Record<number, string> {
  const map: Record<number, string> = {}
  let n = 0
  lines.forEach((line, i) => {
    if (line.type !== 'label') return
    if (REFRAO.test(line.text)) {
      map[i] = 'R'
      return
    }
    n += 1
    if (n <= 9) map[i] = String(n)
  })
  return map
}
