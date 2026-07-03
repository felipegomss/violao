import ChordSheetJS from 'chordsheetjs'

const { ChordProParser, ChordLyricsPair, Tag } = ChordSheetJS

export type ChordSheetItem = { chord: string | null; lyrics: string }
export type ChordSheetLine =
  | { type: 'row'; items: ChordSheetItem[] }
  | { type: 'label'; text: string }
  | { type: 'tab'; lines: string[] }
  | { type: 'empty' }
export type ChordSheet = { lines: ChordSheetLine[] }

const TAB_START = /^\s*\{(start_of_tab|sot)\}\s*$/
const TAB_END = /^\s*\{(end_of_tab|eot)\}\s*$/

// Parseia um trecho SEM blocos de tab via ChordSheetJS → view model.
function parseSegment(content: string): ChordSheetLine[] {
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

  return lines
}

/**
 * Converte ChordPro num view model desacoplado do ChordSheetJS.
 *
 * Blocos de tablatura (`{start_of_tab}`…`{end_of_tab}`, ou `{sot}`/`{eot}`) são
 * extraídos verbatim como linhas `tab` (renderizadas em monospace); o resto vai
 * pro ChordSheetJS.
 *
 * @throws quando o ChordPro é malformado (o `ChordProParser` lança). Quem chama
 * DEVE tratar (ex.: a página envolve em try/catch e cai no texto cru).
 */
export function parseChordSheet(content: string): ChordSheet {
  const raw = content.split('\n')
  const lines: ChordSheetLine[] = []
  let buffer: string[] = []

  const flush = () => {
    if (buffer.length) {
      lines.push(...parseSegment(buffer.join('\n')))
      buffer = []
    }
  }

  for (let i = 0; i < raw.length; i++) {
    if (TAB_START.test(raw[i])) {
      flush()
      const tab: string[] = []
      i++
      while (i < raw.length && !TAB_END.test(raw[i])) {
        tab.push(raw[i])
        i++
      }
      // trim linhas em branco nas bordas do bloco
      while (tab.length && tab[0].trim() === '') tab.shift()
      while (tab.length && tab[tab.length - 1].trim() === '') tab.pop()
      if (tab.length) lines.push({ type: 'tab', lines: tab })
    } else {
      buffer.push(raw[i])
    }
  }
  flush()

  return { lines }
}
