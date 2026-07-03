import guitar from '@tombatossals/chords-db/lib/guitar.json'
import { CHORD_OVERRIDES } from './overrides'

// Forma de um acorde no braço (6 cordas, mi grave → mi agudo).
export type ChordShape = {
  frets: number[] // -1 abafada · 0 solta · N casa
  fingers: number[]
  baseFret: number
  barres: number[]
}

// Fundamental → chave do chords-db (que usa sustenidos p/ C#/F#, bemóis p/ Eb/Ab/Bb).
const ROOT_TO_DBKEY: Record<string, string> = {
  C: 'C', 'B#': 'C',
  'C#': 'Csharp', Db: 'Csharp',
  D: 'D',
  'D#': 'Eb', Eb: 'Eb',
  E: 'E', Fb: 'E',
  F: 'F', 'E#': 'F',
  'F#': 'Fsharp', Gb: 'Fsharp',
  G: 'G',
  'G#': 'Ab', Ab: 'Ab',
  A: 'A',
  'A#': 'Bb', Bb: 'Bb',
  B: 'B', Cb: 'B',
}

// Sufixo (notação BR/variações) → sufixo do chords-db. Sufixo desconhecido tenta
// casar direto; se não achar, o lookup devolve null (sem diagrama, graceful).
const SUFFIX_MAP: Record<string, string> = {
  '': 'major', M: 'major', maj: 'major',
  m: 'minor', '-': 'minor', min: 'minor',
  '7': '7',
  m7: 'm7', '-7': 'm7',
  maj7: 'maj7', '7M': 'maj7', M7: 'maj7', '7+': 'maj7',
  m7b5: 'm7b5', 'm7(5-)': 'm7b5', 'm7(b5)': 'm7b5', ø: 'm7b5',
  dim: 'dim', '°': 'dim', o: 'dim',
  dim7: 'dim7', '°7': 'dim7', o7: 'dim7',
  '6': '6', m6: 'm6',
  '9': '9', '7(9)': '9',
  maj9: 'maj9', '7M(9)': 'maj9',
  m9: 'm9', 'm7(9)': 'm9',
  sus4: 'sus4', sus: 'sus4', '4': 'sus4',
  sus2: 'sus2', '2': 'sus2',
  '7sus4': '7sus4',
  add9: 'add9',
  '11': '11',
  '13': '13', '7(13)': '13',
  aug: 'aug', '+': 'aug',
  '7b9': '7b9', '7(9-)': '7b9', '7(b9)': '7b9',
  '7#9': '7#9', '7(#9)': '7#9', '7(9+)': '7#9',
  '7b5': '7b5', '7(5-)': '7b5', '7(b5)': '7b5',
}

type DbChord = { suffix: string; positions: ChordShape[] }
const chords = guitar.chords as unknown as Record<string, DbChord[]>

const ROOT_RE = /^([A-G][#b]?)(.*)$/

// Devolve a primeira digitação do acorde, ou null se não houver.
// Acordes com baixo invertido (G/B) usam a tríade principal (antes da /).
export function chordDiagram(token: string): ChordShape | null {
  const full = token.trim()
  const main = full.split('/')[0].trim()

  // Overrides têm precedência: acorde completo primeiro (G/B), depois a tríade.
  if (CHORD_OVERRIDES[full]) return CHORD_OVERRIDES[full]
  if (CHORD_OVERRIDES[main]) return CHORD_OVERRIDES[main]

  const m = ROOT_RE.exec(main)
  if (!m) return null

  const dbKey = ROOT_TO_DBKEY[m[1]]
  if (!dbKey) return null

  const suffix = SUFFIX_MAP[m[2]] ?? m[2]
  const entry = chords[dbKey]?.find((c) => c.suffix === suffix)
  const pos = entry?.positions?.[0]
  if (!pos) return null

  return {
    frets: pos.frets,
    fingers: pos.fingers,
    baseFret: pos.baseFret,
    barres: pos.barres,
  }
}
