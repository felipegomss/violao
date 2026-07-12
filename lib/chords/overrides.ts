import type { ChordShape } from './diagram'

// Sobrescreve as digitações de acordes específicos, com precedência sobre o
// chords-db e sobre o gerador automático. É aqui que a gente conserta acorde
// errado, impossível de tocar, ou que o db não tem.
//
// A chave pode ser:
//   - o token exato, ex.: 'E7/G#'  → devolvido como está (você controla o baixo)
//   - a tríade/acorde base, ex.: 'G' → vale pra G; e pra G/B o baixo é aplicado
//     em cima do seu shape automaticamente
//
// O valor é uma LISTA de digitações (aparecem no "variar acorde", em ordem).
//
// Formato de cada shape (6 cordas, mi grave → mi agudo):
//   frets:      [-1 abafada · 0 solta · N casa]  — 6 valores, RELATIVOS ao baseFret
//   fingers:    qual dedo em cada corda (0 = nenhum) — 6 valores
//   baseFret:   1 no começo do braço; N pra shapes mais acima (casa 1 = 1ª exibida)
//   barres:     casas (relativas) com pestana; vazio se não houver
//   bassString: (opcional) índice 0..5 da corda do baixo — desenhada vazada
//
// Exemplo (descomente/edite pra usar):
//   'E7/B': [
//     { frets: [-1, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1, barres: [], bassString: 1 },
//   ],
// B7sus4 (= B7(4)): notas B E F# A. As três formas "must know" do oolimo —
// pestana de A na 2ª, forma de E na 7ª, forma de D na 9ª.
const B7SUS4: ChordShape[] = [
  { frets: [-1, 1, 3, 1, 4, 1], fingers: [0, 1, 3, 1, 4, 1], baseFret: 2, barres: [1], bassString: 1 },
  { frets: [1, 3, 1, 3, 1, 1], fingers: [1, 3, 1, 4, 1, 1], baseFret: 7, barres: [1], bassString: 0 },
  { frets: [-1, -1, 1, 3, 2, 4], fingers: [0, 0, 1, 3, 2, 4], baseFret: 9, barres: [], bassString: 2 },
]

// A7sus4(9) (= A7(4/9)): notas A D E G B (sus4 add9, sem 3ª — não confundir com A11 do db, que tem 3ª).
// Só digitações vindas do print do usuário — nada reconstruído/inventado.
const A7SUS4_9: ChordShape[] = [
  { frets: [-1, 0, 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0], baseFret: 1, barres: [], bassString: 1 },
  { frets: [5, -1, 5, 4, 3, -1], fingers: [3, 0, 4, 2, 1, 0], baseFret: 1, barres: [], bassString: 0 },
]

// E7/B: notas E G# B D, baixo B. Digitações vindas dos prints do usuário.
const E7_B: ChordShape[] = [
  { frets: [-1, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1, barres: [], bassString: 1 },
  { frets: [-1, 2, -1, 1, 3, 0], fingers: [0, 2, 0, 1, 3, 0], baseFret: 1, barres: [], bassString: 1 },
  { frets: [3, -1, 2, 3, 1, -1], fingers: [3, 0, 2, 4, 1, 0], baseFret: 5, barres: [], bassString: 0 },
]

// D(add9)/F# (o "D9/F#" das cifras): notas D F# A E, baixo F#. Lido do braço do oolimo.
const DADD9_F: ChordShape[] = [
  { frets: [2, -1, -1, 2, 3, 0], fingers: [2, 0, 0, 1, 3, 0], baseFret: 1, barres: [], bassString: 0 },
]

// Bm/A: Bm (B D F#) com A no baixo (7ªm). Notas A B D F#. Lido do braço do oolimo.
const BM_A: ChordShape[] = [
  { frets: [5, -1, 4, 4, 3, -1], fingers: [4, 0, 2, 3, 1, 0], baseFret: 1, barres: [], bassString: 0 },
]

// E7/G#: E7 (E G# B D) com G# (3ª maior) no baixo. Notas B D E G#. Lido do braço do oolimo.
const E7_GSHARP: ChordShape[] = [
  { frets: [4, -1, 2, 4, 3, -1], fingers: [2, 0, 1, 4, 3, 0], baseFret: 1, barres: [], bassString: 0 },
]

// F#7/E: F#7 (F# A# C# E) com E (7ªm) no baixo. Notas A# C# E F#. Lido do braço do oolimo (casas 6-8).
const FSHARP7_E: ChordShape[] = [
  { frets: [-1, 2, 3, 1, 2, -1], fingers: [0, 2, 4, 1, 3, 0], baseFret: 6, barres: [], bassString: 1 },
]

// A7M(6/11+) = A maj7(13,#11): notas A C# D# F# G# (sem 5ª). Lido do braço do oolimo
// (corda solta A + casas 4-6, por isso o diagrama expande o nº de casas).
const A7M_6_11: ChordShape[] = [
  { frets: [-1, 0, 4, 6, 4, 4], fingers: [0, 0, 1, 4, 2, 3], baseFret: 1, barres: [] },
]

// Dm7(9) = Dm9: notas D F A C E. A seed do db mostrava também inversões (baixo em
// F) e formas esquisitas; aqui ficam só as duas com D no baixo (= oolimo).
const DM9: ChordShape[] = [
  { frets: [-1, 3, 1, 3, 3, 3], fingers: [0, 2, 1, 3, 4, 4], baseFret: 3, barres: [3] },
  { frets: [1, 3, 1, 1, 1, 3], fingers: [1, 3, 1, 1, 1, 4], baseFret: 10, barres: [1] },
]

// Dm/C: Dm (D F A) com C no baixo (7ªm). Notas A C D F. Lido do braço do oolimo
// (db não tem m/C pra D). Baixo C na 5ª (casa 3) / na 6ª (casa 8).
const DM_C: ChordShape[] = [
  { frets: [-1, 3, -1, 2, 3, 1], fingers: [0, 3, 0, 2, 4, 1], baseFret: 1, barres: [], bassString: 1 },
  { frets: [3, -1, 2, 2, 1, -1], fingers: [4, 0, 2, 3, 1, 0], baseFret: 6, barres: [], bassString: 0 },
]

// C9/E: C9 (C E G Bb D) com E (3ª) no baixo. Notas A# C D E G. Formas com E na
// 6ª solta (o db não tem slash de 9); notas conferidas.
const C9_E: ChordShape[] = [
  { frets: [0, 3, 2, 3, 3, 3], fingers: [0, 2, 1, 3, 3, 3], baseFret: 1, barres: [3], bassString: 0 },
  { frets: [0, 1, 0, 0, 1, 0], fingers: [0, 1, 0, 0, 2, 0], baseFret: 1, barres: [], bassString: 0 },
]

// D7(#11) (= D7(11+)): notas D F# C G# (dominante com #11, sem 5ª). As 5 posições
// do oolimo subindo o braço; cada corda/casa conferida pelos rótulos de intervalo
// (3 · 7 · #11 · 1). Nada reconstruído — lido dos 5 prints.
const D7_SHARP11: ChordShape[] = [
  { frets: [-1, -1, 0, 1, 1, 2], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1, barres: [] },
  { frets: [-1, -1, 2, 3, 1, 2], fingers: [0, 0, 2, 4, 1, 3], baseFret: 3, barres: [] },
  { frets: [-1, 2, -1, 2, 4, 1], fingers: [0, 2, 0, 3, 4, 1], baseFret: 4, barres: [] },
  { frets: [-1, 1, 2, 1, 3, -1], fingers: [0, 2, 3, 1, 4, 0], baseFret: 5, barres: [] },
  { frets: [-1, -1, 1, 2, 2, 3], fingers: [0, 0, 1, 2, 3, 4], baseFret: 6, barres: [] },
]

export const CHORD_OVERRIDES: Record<string, ChordShape[]> = {
  'E7/B': E7_B,
  B7sus4: B7SUS4,
  'B7(4)': B7SUS4,
  'A7sus4(9)': A7SUS4_9,
  'A7(4/9)': A7SUS4_9,
  'D9/F#': DADD9_F,
  'Dadd9/F#': DADD9_F,
  'D(add9)/F#': DADD9_F,
  'Bm/A': BM_A,
  'E7/G#': E7_GSHARP,
  'F#7/E': FSHARP7_E,
  'A7M(6/11+)': A7M_6_11,
  'Dm7(9)': DM9,
  Dm9: DM9,
  'Dm/C': DM_C,
  'C9/E': C9_E,
  'D7(#11)': D7_SHARP11,
  'D7(11+)': D7_SHARP11,
}
