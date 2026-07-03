import guitar from '@tombatossals/chords-db/lib/guitar.json'
import { CHORD_OVERRIDES } from './overrides'

// Forma de um acorde no braço (6 cordas, mi grave → mi agudo).
export type ChordShape = {
  frets: number[] // -1 abafada · 0 solta · N casa
  fingers: number[]
  baseFret: number
  barres: number[]
  bassString?: number // índice da corda (0..5) que soa o baixo (acorde com barra), p/ destacar
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
  '7sus4': '7sus4', '7(4)': '7sus4',
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
// Baixo (barra) só quando o token TERMINA em /Nota — evita quebrar em A7M(6/11+).
const SLASH_RE = /^(.*?)\/([A-G][#b]?)$/

// Nota (com acidente) → classe de altura (C=0). Cobre enarmonias.
const NOTE_PC: Record<string, number> = {
  C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4,
  'E#': 5, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11,
}
// Classe de altura → nome com sustenido (grafia que o chords-db usa nos baixos: /G#, /D#…).
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// Cordas soltas (mi grave → mi agudo), em classe de altura.
const OPEN_PC = [4, 9, 2, 7, 11, 4]
// Qualidade do acorde → prefixo do sufixo-com-baixo do chords-db (só tem tríade maior/menor).
const SLASH_QUALITY: Record<string, string> = { '': '', m: 'm', '-': 'm', min: 'm' }

const clone = (p: ChordShape): ChordShape => ({
  frets: [...p.frets],
  fingers: [...p.fingers],
  baseFret: p.baseFret,
  barres: [...p.barres],
  ...(p.bassString != null ? { bassString: p.bassString } : {}),
})

// Casa absoluta no braço. Corda solta (0) é sempre solta; casa N (>=1) é relativa
// ao baseFret (casa 1 = 1ª exibida), então vale baseFret + N - 1.
const absFret = (baseFret: number, f: number) => (f <= 0 ? f : baseFret > 1 ? baseFret - 1 + f : f)
const noteAt = (p: ChordShape, i: number) =>
  p.frets[i] < 0 ? null : (OPEN_PC[i] + absFret(p.baseFret, p.frets[i])) % 12
const lowestPlayed = (p: ChordShape) => {
  for (let i = 0; i < 6; i++) if (p.frets[i] >= 0) return i
  return -1
}

// Marca qual corda é o baixo (sem inventar digitação): se a corda mais grave
// tocada soa a nota do baixo, aponta ela. É só p/ destacar acordes-com-baixo
// que já vêm prontos do chords-db (não gera nada).
function markBass(p: ChordShape, bassPc: number): ChordShape {
  const lo = lowestPlayed(p)
  return lo >= 0 && noteAt(p, lo) === bassPc ? { ...p, bassString: lo } : p
}

// Parece nome de acorde? (fundamental válida). Serve pro grid decidir entre
// mostrar "sem digitação" e ignorar um token que nem é acorde (N.C., %…).
export function looksLikeChord(token: string): boolean {
  const full = token.trim()
  if (CHORD_OVERRIDES[full]) return true
  const sm = SLASH_RE.exec(full)
  const mainPart = (sm ? sm[1] : full).trim()
  const m = ROOT_RE.exec(mainPart)
  return !!(m && ROOT_TO_DBKEY[m[1]])
}

// Todas as digitações conhecidas do acorde. NÃO gera nada: vem de override ou do
// chords-db. Acorde-com-baixo só se existe (override do token, ou tríade /X do db);
// senão devolve vazio — o grid mostra "sem digitação" e o usuário manda pra adicionar.
export function chordPositions(token: string): ChordShape[] {
  const full = token.trim()
  if (CHORD_OVERRIDES[full]) return CHORD_OVERRIDES[full].map(clone)

  const sm = SLASH_RE.exec(full)
  const mainPart = (sm ? sm[1] : full).trim()
  const bassPart = sm ? sm[2] : ''

  const m = ROOT_RE.exec(mainPart)
  if (!m) return []
  const dbKey = ROOT_TO_DBKEY[m[1]]
  if (!dbKey) return []

  const quality = m[2]
  const suffix = SUFFIX_MAP[quality] ?? quality
  // override do acorde base tem precedência sobre o chords-db
  const basePositions = (
    CHORD_OVERRIDES[mainPart] ?? chords[dbKey]?.find((c) => c.suffix === suffix)?.positions ?? []
  ).map(clone)

  if (!bassPart) return basePositions

  const bassPc = NOTE_PC[bassPart]
  if (bassPc == null) return basePositions

  // acorde-com-baixo pronto no chords-db (tríades maior/menor: /G#, m/C…)
  const slashQ = SLASH_QUALITY[quality]
  if (slashQ != null) {
    const slash = chords[dbKey]?.find((c) => c.suffix === `${slashQ}/${SHARP[bassPc]}`)
    if (slash) return slash.positions.map((p) => markBass(clone(p), bassPc))
  }

  // sem digitação pronta pro baixo → nada (usuário manda pra adicionar via override)
  return []
}

// Digitação numa posição específica (padrão: a primeira), ou null se não houver.
export function chordDiagram(token: string, index = 0): ChordShape | null {
  return chordPositions(token)[index] ?? chordPositions(token)[0] ?? null
}
