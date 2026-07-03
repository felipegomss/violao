// Transformação de acordes para a view da cifra (§7): grau ↔ acorde e transposição.
// Regra central: converte só a fundamental (e o baixo após "/"); o sufixo do acorde
// permanece literal — a notação BR (m7(5-), 7M, (9-)) nunca é tocada.

const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  Fb: 'E',
}

// Grau por intervalo em semitons a partir do tom (§7). Numeral sempre maiúsculo.
const DEGREES = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII']

const ROOT_RE = /^([A-G][#b]?)(.*)$/

// Pitch class (0–11) de uma fundamental já isolada, ou -1 se inválida.
function pitchClass(root: string): number {
  const norm = FLAT_TO_SHARP[root] ?? root
  return SHARP.indexOf(norm)
}

// Pitch class do tom (que pode vir com qualidade, ex.: "Cm", "F#m").
function keyPitchClass(key: string): number {
  const m = ROOT_RE.exec(key.trim())
  return m ? pitchClass(m[1]) : -1
}

// Aplica fn à fundamental de cada parte de um acorde (incl. baixo após "/"),
// preservando o sufixo. Tokens não-acorde voltam intactos.
function mapChordRoots(chord: string, fn: (rootPc: number, suffix: string) => string): string {
  return chord
    .split('/')
    .map((part) => {
      const m = ROOT_RE.exec(part)
      if (!m) return part
      const pc = pitchClass(m[1])
      if (pc < 0) return part
      return fn(pc, m[2])
    })
    .join('/')
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord
  return mapChordRoots(chord, (pc, suffix) => {
    const next = (pc + (semitones % 12) + 12) % 12
    return SHARP[next] + suffix
  })
}

export function degreeChord(chord: string, key: string): string {
  const keyPc = keyPitchClass(key)
  if (keyPc < 0) return chord
  return mapChordRoots(chord, (pc, suffix) => {
    const interval = (pc - keyPc + 12) % 12
    return DEGREES[interval] + suffix
  })
}
