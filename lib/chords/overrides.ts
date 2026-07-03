import type { ChordShape } from './diagram'

// Sobrescreve o shape de acordes específicos, tendo precedência sobre o
// chords-db. A chave pode ser:
//   - o acorde completo, ex.: 'G/B'  (casa exato, inclusive baixo invertido)
//   - a tríade principal, ex.: 'G'   (vale pra G e, se não houver override
//     específico, pra G/B — que usa a tríade principal)
//
// Formato do shape (6 cordas, mi grave → mi agudo):
//   frets:   [-1 abafada · 0 solta · N casa]  — 6 valores
//   fingers: qual dedo em cada corda (0 = nenhum) — 6 valores
//   baseFret: 1 no começo do braço; N pra shapes mais acima
//   barres:  casas onde há pestana (vazio se não houver)
//
// Exemplo (deixe comentado; descomente/edite pra usar):
//   'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1, barres: [] },
export const CHORD_OVERRIDES: Record<string, ChordShape> = {}
