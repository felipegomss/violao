import ChordSheetJS from 'chordsheetjs'

const { ChordProParser, ChordLyricsPair, Tag } = ChordSheetJS

export type ChordSheetItem = { chord: string | null; lyrics: string }
export type ChordSheetLine =
  | { type: 'row'; items: ChordSheetItem[] }
  | { type: 'label'; text: string }
  | { type: 'empty' }
export type ChordSheet = { lines: ChordSheetLine[] }

/**
 * Converte ChordPro (formato TRADICIONAL) num view model desacoplado do ChordSheetJS.
 *
 * @throws quando o ChordPro é malformado (o `ChordProParser` lança). Quem chama
 * DEVE tratar (ex.: o componente `Cifra` envolve em try/catch e cai no texto cru).
 */
export function parseChordSheet(content: string): ChordSheet {
  const song = new ChordProParser().parse(content)
  const lines: ChordSheetLine[] = []

  for (const line of song.lines) {
    if (line.isEmpty()) {
      lines.push({ type: 'empty' })
      continue
    }

    const items: ChordSheetItem[] = []
    let label: string | null = null

    for (const item of line.items) {
      if (item instanceof ChordLyricsPair) {
        const chord = item.chords ? item.chords : null
        const lyrics = item.lyrics ?? ''
        if (chord === null && lyrics === '') continue
        items.push({ chord, lyrics })
      } else if (item instanceof Tag) {
        if (item.isMetaTag()) continue
        if (item.name === 'comment') {
          label = item.value
        } else if (item.isSectionStart() && item.label) {
          label = item.label
        }
      }
    }

    if (items.length > 0) {
      lines.push({ type: 'row', items })
    } else if (label) {
      lines.push({ type: 'label', text: label })
    }
  }

  return { lines }
}
