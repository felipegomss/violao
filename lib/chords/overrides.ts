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
const A7SUS4_9: ChordShape[] = [
  { frets: [-1, 0, 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0], baseFret: 1, barres: [], bassString: 1 },
  { frets: [-1, 0, 0, 2, 0, 3], fingers: [0, 0, 0, 1, 0, 3], baseFret: 1, barres: [], bassString: 1 },
]

export const CHORD_OVERRIDES: Record<string, ChordShape[]> = {
  // E7 com baixo em B: forma aberta do E7 com a 6ª abafada (B na 5ª corda). oolimo "must know".
  'E7/B': [
    { frets: [-1, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1, barres: [], bassString: 1 },
  ],
  B7sus4: B7SUS4,
  'B7(4)': B7SUS4,
  'A7sus4(9)': A7SUS4_9,
  'A7(4/9)': A7SUS4_9,
}
