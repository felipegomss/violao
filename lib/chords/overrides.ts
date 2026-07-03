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
export const CHORD_OVERRIDES: Record<string, ChordShape[]> = {}
